import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

// Starts a Stripe Checkout session for the caller's own org. Never trusts
// a client-supplied org id -- always resolves it server-side from the
// caller's JWT via profiles.org_id, same pattern as the rest of the app's
// RLS model. Requires STRIPE_SECRET_KEY and STRIPE_PRICE_ID secrets set on
// this project (Project Settings -> Edge Functions -> Secrets).

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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const priceId = Deno.env.get("STRIPE_PRICE_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://eventopoint.app";

    if (!stripeSecretKey || !priceId || !supabaseUrl || !serviceRoleKey) {
      return jsonError(500, "Billing is not configured for this project yet.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError(401, "Not signed in.");
    }

    // Resolve the calling user from their own JWT (forwarded by the client).
    const callerClient = createClient(supabaseUrl, anonKey ?? serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonError(401, "Not signed in.");
    }

    // Everything past this point uses the service-role client -- reading
    // another table's org row and writing stripe_customer_id are both
    // things the caller's own RLS-scoped client either can't do (write is
    // locked to service_role by the billing lock trigger) or shouldn't
    // need broader grants for just to check out.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("org_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError || !profile?.org_id) {
      return jsonError(400, "No organization found for this account.");
    }

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", profile.org_id)
      .maybeSingle();

    if (orgError || !org) {
      return jsonError(400, "Organization not found.");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

    let customerId = org.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.user.email ?? undefined,
        name: org.name ?? undefined,
        metadata: { org_id: org.id },
      });
      customerId = customer.id;
      // Cache it now so a retry doesn't create a duplicate Stripe customer.
      // Service-role write -- bypasses the client billing lock trigger.
      await admin.from("organizations").update({ stripe_customer_id: customerId }).eq("id", org.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
      client_reference_id: org.id,
      subscription_data: { metadata: { org_id: org.id } },
      metadata: { org_id: org.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : String(err));
  }
});
