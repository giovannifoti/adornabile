import {
  createStripeClient,
  handleStripeEvent,
  hasProcessedStripeEvent,
  readBody,
  recordStripeEvent,
  respond,
} from "../lib/shared.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Metodo non consentito." });
  }

  const stripe = createStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return respond(400, { error: "Webhook Stripe non configurato." });
  }

  const signature = event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"];

  if (!signature) {
    return respond(400, { error: "Firma Stripe mancante." });
  }

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(readBody(event), signature, webhookSecret);
  } catch {
    return respond(400, { error: "Firma Stripe non valida." });
  }

  try {
    if (await hasProcessedStripeEvent(stripeEvent.id)) {
      return respond(200, { received: true, duplicate: true });
    }

    await handleStripeEvent(stripeEvent);
    await recordStripeEvent(stripeEvent);
    return respond(200, { received: true });
  } catch (error) {
    return respond(500, {
      error: error instanceof Error ? error.message : "Webhook Stripe non elaborato.",
    });
  }
};
