import { respond } from "../lib/shared.mjs";

export const handler = async () =>
  respond(200, {
    ok: true,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    storage: "netlify-blobs",
  });
