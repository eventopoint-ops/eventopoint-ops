import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

// Receives billing events from Stripe and syncs them onto
// organizations.subscription_status / stripe_customer_id /
// stripe_subscription_id / trial_ends_at / current_period_end. This is the
// ONLY code path allowed to write those columns (see the billing lock
// trigger in migration add_subscription_billing_columns_and_lock) -- it
// writes with the service-role key, which the trigger explicitly allows.
//
// Configure this URL as a webhook endpoint in the Stripe Dashboard
// (Developers -> Webhooks), subscribed to at least: checkout.session.completed,
// customer.subscription.created, customer.subscription.updated,
// customer.subscription.deleted. Requires STRIPE_SECRET_KEY and
// STRIPE_WEBHOOK_SECRET secrets set on this project.

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!signature || !webhookSecret || !stripeSecretKey || !supabaseUrl || !serviceRoleKey) {
    return new Response("Webhook not configured", { status: 500 });
  }

  const body = await req.text();
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
  // Edge functions run on Deno's Web Crypto, not Node's -- Stripe's async
  // verifier + subtle-crypto provider is the supported way to check
  // signatures in this runtime.
  const cryptoProvider = Stripe.createSubtleCryptoProvider();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Signature verification failed: ${message}`, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  async function updateOrg(orgId: string | undefined, patch: Record<string, unknown>) {
    if (!orgId) return;
    await admin.from("organizations").update(patch).eq("id", orgId);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id ?? session.client_reference_id ?? undefined;
        await updateOrg(orgId, {
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id ?? undefined;
        await updateOrg(orgId, {
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id ?? undefined;
        await updateOrg(orgId, { subscription_status: "canceled" });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Return 500 (not 200) on handler errors so Stripe retries and the
    // failure shows up in the Stripe Dashboard's webhook delivery log --
    // swallowing this would silently desync billing state again.
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Webhook handler error: ${message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
