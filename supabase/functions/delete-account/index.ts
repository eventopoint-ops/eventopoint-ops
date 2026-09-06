import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

// Permanently deletes the calling user's account.
//
// Required by App Store Review Guideline 5.1.1(v): any app that lets a
// user create an account must let them initiate deleting it from inside
// the app. This is that endpoint.
//
// Never trusts a client-supplied user id -- the account deleted is always
// the one resolved from the caller's own JWT.
//
// Ordering matters. Three FKs to auth.users are ON DELETE NO ACTION
// (events.created_by, tasks.owner_id, event_notes.created_by), so the
// auth user delete fails outright unless those references are cleared
// first. profiles.id is ON DELETE CASCADE, so the profile row goes on its
// own once the auth user is gone.
//
// If the caller is the last member of their organization, the whole org
// and everything under it is deleted too -- an orphaned org with no one
// able to sign into it is just abandoned customer data. If other members
// remain, the org is left intact and only the caller's own account goes.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonError(500, "Account deletion is not configured for this project.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError(401, "Not signed in.");

    const callerClient = createClient(supabaseUrl, anonKey ?? serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData?.user) return jsonError(401, "Not signed in.");

    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await admin
      .from("profiles")
      .select("org_id")
      .eq("id", userId)
      .maybeSingle();

    const orgId = profile?.org_id ?? null;

    // Is this the last person who can sign into this org?
    let soleMember = false;
    if (orgId) {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .neq("id", userId);
      soleMember = (count ?? 0) === 0;
    }

    if (orgId && soleMember) {
      // Cancel billing before the org row disappears, so she isn't
      // charging a customer whose data no longer exists.
      if (stripeSecretKey) {
        try {
          const { data: org } = await admin
            .from("organizations")
            .select("stripe_subscription_id")
            .eq("id", orgId)
            .maybeSingle();
          if (org?.stripe_subscription_id) {
            const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
            await stripe.subscriptions.cancel(org.stripe_subscription_id);
          }
        } catch (_err) {
          // Billing cleanup is best effort -- never block a user's
          // deletion request on Stripe being reachable.
        }
      }

      // Remove stored vendor files for this org's events. Storage objects
      // are not covered by any FK cascade, so they'd otherwise linger.
      const { data: orgEvents } = await admin
        .from("events")
        .select("id")
        .eq("org_id", orgId);
      const eventIds = (orgEvents ?? []).map((e: { id: string }) => e.id);
      for (const eventId of eventIds) {
        try {
          const { data: listed } = await admin.storage
            .from("vendor-files")
            .list(eventId, { limit: 1000 });
          for (const entry of listed ?? []) {
            const { data: inner } = await admin.storage
              .from("vendor-files")
              .list(`${eventId}/${entry.name}`, { limit: 1000 });
            const paths = (inner ?? []).map((f: { name: string }) => `${eventId}/${entry.name}/${f.name}`);
            if (paths.length) await admin.storage.from("vendor-files").remove(paths);
          }
        } catch (_err) {
          // Same reasoning as above -- storage cleanup must not strand
          // the account in a half-deleted state.
        }
      }

      // events cascade to tasks, vendors, team_members, notes, reviews and
      // ratings. team_members also hangs off org_id with NO ACTION, so any
      // org-level rows left over have to go before the org itself.
      await admin.from("events").delete().eq("org_id", orgId);
      await admin.from("team_members").delete().eq("org_id", orgId);
      await admin.from("error_logs").delete().eq("org_id", orgId);
      await admin.from("organizations").delete().eq("id", orgId);
    }

    // Clear the remaining NO ACTION references to this user. After an org
    // wipe most of these are already gone; this covers the multi-member
    // case and anything pointing at another org.
    await admin.from("events").update({ created_by: null }).eq("created_by", userId);
    await admin.from("tasks").update({ owner_id: null }).eq("owner_id", userId);
    await admin.from("event_notes").update({ created_by: null }).eq("created_by", userId);
    await admin.from("error_logs").update({ user_id: null }).eq("user_id", userId);

    // profiles.id is ON DELETE CASCADE from auth.users, but delete it
    // explicitly so a failure here surfaces as an error rather than as a
    // confusing FK violation from the auth API.
    await admin.from("profiles").delete().eq("id", userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return jsonError(500, `Could not delete the account: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : String(err));
  }
});
