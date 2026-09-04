import { connectLambda, getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import Stripe from "stripe";

export const freeShippingThresholdCents = 8000;

export const catalog = {
  "essenza-pura": {
    title: "Essenza Pura",
    options: {
      media: { label: "Media", priceCents: 4000 },
      grande: { label: "Grande", priceCents: 7000 },
    },
  },
  essenza: {
    title: "Essenza",
    options: {
      unica: { label: "Unica", priceCents: 4000 },
    },
  },
  "essenza-petit": {
    title: "Essenza Petit",
    options: {
      unica: { label: "Unica", priceCents: 2500 },
    },
  },
  "lettera-floreale": {
    title: "Lettera Floreale",
    options: {
      piccola: { label: "Piccola", priceCents: 1500 },
      grande: { label: "Grande", priceCents: 4000 },
    },
  },
};

export function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

export function readBody(event) {
  if (!event.body) return "";
  return event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
}

export function readJson(event) {
  try {
    const body = readBody(event);
    return body ? JSON.parse(body) : {};
  } catch {
    const error = new Error("JSON non valido.");
    error.statusCode = 400;
    throw error;
  }
}

export function readText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function throwBadRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

export function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throwBadRequest("Il carrello è vuoto.");
  }

  return items.map((item) => {
    const productId = readText(item.productId, 80);
    const product = catalog[productId];
    if (!product) throwBadRequest("Prodotto non valido.");

    const optionId = readText(item.optionId, 80);
    const option = product.options[optionId];
    if (!option) throwBadRequest("Variante non valida.");

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throwBadRequest("Quantità non valida.");
    }

    return {
      productId,
      productTitle: product.title,
      optionId,
      optionLabel: option.label,
      unitPriceCents: option.priceCents,
      quantity,
      lineTotalCents: option.priceCents * quantity,
    };
  });
}

export function validateCustomer(customerPayload) {
  const customer = {
    fullName: readText(customerPayload?.fullName, 160),
    email: readText(customerPayload?.email, 160),
    phone: readText(customerPayload?.phone, 80),
    address: readText(customerPayload?.address, 240),
    city: readText(customerPayload?.city, 120),
    province: readText(customerPayload?.province, 80),
    postalCode: readText(customerPayload?.postalCode, 20),
    country: readText(customerPayload?.country, 80) || "Italia",
    deliveryNotes: readText(customerPayload?.deliveryNotes, 600),
    dedication: readText(customerPayload?.dedication, 600),
    topperTheme: readText(customerPayload?.topperTheme, 180),
    premiumPackaging: Boolean(customerPayload?.premiumPackaging),
  };

  for (const field of ["fullName", "email", "phone", "address", "city", "province", "postalCode"]) {
    if (!customer[field]) throwBadRequest("Compila tutti i dati obbligatori.");
  }

  return customer;
}

export function createOrderId() {
  return `AD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function getShippingNote(subtotalCents) {
  return subtotalCents >= freeShippingThresholdCents
    ? "Spedizione gratuita applicata"
    : "Spedizione da confermare dopo l'ordine";
}

export function getRequestOrigin(event) {
  const host = event.headers?.host || event.headers?.Host;
  const forwardedProto =
    String(event.headers?.["x-forwarded-proto"] || event.headers?.["X-Forwarded-Proto"] || "")
      .split(",")[0]
      .trim() || "https";

  return host ? `${forwardedProto}://${host}` : "https://adornabile.it";
}

export function createStripeClient() {
  return process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
}

export function connectNetlifyBlobs(event) {
  connectLambda(event);
}

export async function readOrders() {
  const store = getStore("adornabile-orders");
  const orders = await store.get("orders", { type: "json", consistency: "strong" });
  return Array.isArray(orders) ? orders : [];
}

export async function upsertOrder(order) {
  const store = getStore("adornabile-orders");
  const orders = await readOrders();
  const nextOrders = [order, ...orders.filter((savedOrder) => savedOrder.id !== order.id)];
  await store.setJSON("orders", nextOrders);
}

export async function updateOrderStatus(orderId, status, updates = {}) {
  const store = getStore("adornabile-orders");
  const orders = await readOrders();
  const nextOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          ...updates,
          status,
          updatedAt: new Date().toISOString(),
        }
      : order,
  );
  await store.setJSON("orders", nextOrders);
}

export async function readStripeEvents() {
  const store = getStore("adornabile-stripe-events");
  const events = await store.get("events", { type: "json", consistency: "strong" });
  return Array.isArray(events) ? events : [];
}

export async function hasProcessedStripeEvent(eventId) {
  const events = await readStripeEvents();
  return events.some((event) => event.id === eventId);
}

export async function recordStripeEvent(event) {
  const store = getStore("adornabile-stripe-events");
  const events = await readStripeEvents();
  const nextEvents = [
    {
      id: event.id,
      type: event.type,
      createdAt: new Date().toISOString(),
    },
    ...events.filter((savedEvent) => savedEvent.id !== event.id),
  ].slice(0, 500);

  await store.setJSON("events", nextEvents);
}

export async function handleStripeEvent(event) {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.async_payment_failed" &&
    event.type !== "checkout.session.expired"
  ) {
    return;
  }

  const session = event.data.object;
  const orderId = session.client_reference_id ?? session.metadata?.order_id;
  if (!orderId) return;

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await updateOrderStatus(orderId, "Pagato", {
      paidAt: new Date().toISOString(),
      paymentProvider: "Stripe Checkout",
      stripeSessionId: session.id,
      totalCents: session.amount_total ?? undefined,
    });
    return;
  }

  if (event.type === "checkout.session.async_payment_failed") {
    await updateOrderStatus(orderId, "Pagamento non riuscito", {
      paymentProvider: "Stripe Checkout",
      stripeSessionId: session.id,
    });
    return;
  }

  await updateOrderStatus(orderId, "Pagamento scaduto", {
    paymentProvider: "Stripe Checkout",
    stripeSessionId: session.id,
  });
}
