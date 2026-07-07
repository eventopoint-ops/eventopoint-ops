import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

  try {
    const { document, team } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      await logDebug("ANTHROPIC_API_KEY secret is missing or empty");
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured for this project." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const teamList = Array.isArray(team)
      ? team.map((m: any) => `"${m.id}"=${m.name}(${m.role})`).join(", ")
      : "";

    const prompt = `Parse this event run-of-show. Return ONLY a JSON array, no explanation, no markdown, no trailing commentary — the response must be complete, valid JSON.
Team: ${teamList}
Each item: { time:"HH:MM", task:string, ownerId:string, category:"Setup"|"Tech"|"Décor"|"Guest"|"F&B", phase:"setup"|"event"|"postevent", status:"pending" }
Keep each task description concise (under 12 words) so the full list fits.
Document: ${String(document || "").slice(0, 6000)}`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      await logDebug(`status=${anthropicRes.status} keylen=${apiKey.length} keyprefix=${apiKey.slice(0,7)} body=${errText}`);
      return new Response(
        JSON.stringify({ error: `Anthropic API error (${anthropicRes.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await anthropicRes.json();
    const stopReason = json?.stop_reason;
    const text = json?.content?.find((c: any) => c.type === "text")?.text || "[]";
    const cleaned = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned).map((t: any, i: number) => ({ ...t, id: Date.now() + i }));
    } catch (parseErr) {
      await logDebug(`JSON parse failed (stop_reason=${stopReason}): ${String(parseErr)} || raw_tail=${cleaned.slice(-300)}`);
      return new Response(
        JSON.stringify({ error: `Could not parse AI response as JSON (stop_reason=${stopReason}). Try a shorter document or paste text instead.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ tasks: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    await logDebug(`Unhandled error: ${String(e?.message || e)}`);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
