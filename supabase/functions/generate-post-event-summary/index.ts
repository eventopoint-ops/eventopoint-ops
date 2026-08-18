import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Reads everything collected about one event -- the run-of-show (tasks +
// their statuses), staff and their ratings, vendors and their ratings, and
// freeform notes from any stage (before/during/after) -- and asks Claude
// to write a short post-event conclusion plus concrete suggestions
// (rebook this vendor, watch this phase next time, etc).
//
// Runs entirely under the caller's own RLS-scoped access (forwards their
// JWT) rather than a service-role client -- event_reviews and the rating
// tables are normal org-scoped data any org member can already read/write,
// unlike the billing columns, so there's no need for elevated access here.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function logDebug(detail: string) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const admin = createClient(url, key);
    await admin.from("_debug_ai_errors").insert({ detail });
  } catch (_) {
    // swallow logging errors
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonError = (status: number, message: string) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { event_id } = await req.json();
    if (!event_id) return jsonError(400, "event_id is required.");

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!apiKey || !supabaseUrl) {
      return jsonError(500, "This feature is not configured for this project.");
    }
    if (!authHeader) return jsonError(401, "Not signed in.");

    // Caller's own RLS-scoped client -- every query below is naturally
    // limited to data the signed-in user's org can already see.
    const client = createClient(supabaseUrl, anonKey ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const [eventRes, tasksRes, teamRes, vendorsRes, notesRes, staffRatingsRes, vendorRatingsRes, reviewRes] =
      await Promise.all([
        client.from("events").select("*").eq("id", event_id).maybeSingle(),
        client.from("tasks").select("time, task, status, category, phase").eq("event_id", event_id),
        client.from("team_members").select("id, name, role, checked_in").eq("event_id", event_id),
        client.from("vendors").select("id, name, type, notes").eq("event_id", event_id),
        client.from("event_notes").select("stage, note, created_at").eq("event_id", event_id),
        client.from("staff_ratings").select("team_member_id, rating, notes").eq("event_id", event_id),
        client.from("vendor_ratings").select("vendor_id, rating, notes").eq("event_id", event_id),
        client.from("event_reviews").select("*").eq("event_id", event_id).maybeSingle(),
      ]);

    if (eventRes.error || !eventRes.data) {
      return jsonError(404, "Event not found or you don't have access to it.");
    }

    const event = eventRes.data;
    const tasks = tasksRes.data || [];
    const team = teamRes.data || [];
    const vendors = vendorsRes.data || [];
    const notes = notesRes.data || [];
    const staffRatings = staffRatingsRes.data || [];
    const vendorRatings = vendorRatingsRes.data || [];
    const review = reviewRes.data;

    const staffById = Object.fromEntries(team.map((t) => [t.id, t]));
    const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]));

    const issueTasks = tasks.filter((t) => t.status === "issue");
    const doneCount = tasks.filter((t) => t.status === "done").length;

    const staffSummary = staffRatings
      .map((r) => `${staffById[r.team_member_id]?.name ?? "Unknown"}: ${r.rating}/5${r.notes ? ` — ${r.notes}` : ""}`)
      .join("\n") || "No staff ratings recorded.";

    const vendorSummary = vendorRatings
      .map((r) => `${vendorById[r.vendor_id]?.name ?? "Unknown"}: ${r.rating}/5${r.notes ? ` — ${r.notes}` : ""}`)
      .join("\n") || "No vendor ratings recorded.";

    const notesSummary = notes.length
      ? notes.map((n) => `[${n.stage}] ${n.note}`).join("\n")
      : "No freeform notes recorded.";

    const issuesSummary = issueTasks.length
      ? issueTasks.map((t) => `${t.time ?? ""} ${t.task}`).join("\n")
      : "No tasks flagged as an issue.";

    const prompt = `You are helping an event producer review how an event went. Write a short, honest post-event conclusion and concrete suggestions for next time. Be specific, not generic -- reference actual names, ratings, and notes given below when relevant. Return ONLY valid JSON, no markdown, no commentary, in this exact shape:
{"summary": "2-4 sentence conclusion of how the event went", "suggestions": "3-6 concrete, specific suggestions as a single string with line breaks between each, e.g. rebook/avoid specific vendors or staff by name, process changes for next time"}

EVENT: ${event.name}, ${event.event_date ?? "no date"}, ${event.venue ?? "no venue"}, ${event.guest_count ?? "unknown"} guests.

RUN OF SHOW: ${tasks.length} tasks total, ${doneCount} marked done.
Tasks flagged as an issue:
${issuesSummary}

STAFF RATINGS:
${staffSummary}

VENDOR RATINGS:
${vendorSummary}

NOTES FROM BEFORE/DURING/AFTER THE EVENT:
${notesSummary}

OVERALL NOTES FROM THE TEAM: ${review?.overall_notes || "none"}
GUEST FEEDBACK: ${review?.guest_feedback || "none"}
IMPROVEMENTS ALREADY FLAGGED: ${review?.improvements_needed || "none"}`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      await logDebug(`Anthropic API error: ${anthropicRes.status} ${detail.slice(0, 500)}`);
      return jsonError(502, "AI summary generation failed. Try again in a moment.");
    }

    const anthropicJson = await anthropicRes.json();
    const rawText = anthropicJson?.content?.[0]?.text ?? "";

    let parsed: { summary?: string; suggestions?: string };
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {
      await logDebug(`Could not parse AI response as JSON: ${rawText.slice(0, 500)}`);
      return jsonError(502, "AI response was not in the expected format. Try again.");
    }

    const nowIso = new Date().toISOString();
    const { data: saved, error: saveError } = await client
      .from("event_reviews")
      .upsert(
        {
          event_id,
          ai_summary: parsed.summary ?? null,
          ai_suggestions: parsed.suggestions ?? null,
          ai_generated_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "event_id" }
      )
      .select()
      .single();

    if (saveError) {
      return jsonError(500, `AI summary generated but couldn't be saved: ${saveError.message}`);
    }

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : String(err));
  }
});
