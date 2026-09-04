import {
  connectNetlifyBlobs,
  createOrderId,
  createStripeClient,
  getRequestOrigin,
  getShippingNote,
  readJson,
  respond,
  upsertOrder,
  validateCartItems,
  validateCustomer,
} from "../lib/shared.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Metodo non consentito." });
  }

  try {
    connectNetlifyBlobs(event);

    const payload = readJson(event);
    const items = validateCartItems(payload.items);
    const customer = validateCustomer(payload.customer);
    const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
    const stripe = createStripeClient();
    let order = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      items,
      customer,
      subtotalCents,
      totalCents: subtotalCents,
      status: "In attesa di pagamento",
      paymentProvider: "Stripe Checkout",
      shippingNote: getShippingNote(subtotalCents),
    };

    if (!stripe) {
      order = {
        ...order,
        status: "Ordine salvato - Stripe non configurato",
        paymentProvider: "Pagamento non configurato",
      };
      await upsertOrder(order);
      return respond(200, {
        order,
        checkoutUrl: `/#pagamento?order=${encodeURIComponent(order.id)}`,
        provider: order.paymentProvider,
        configured: false,
      });
    }

    const origin = process.env.PUBLIC_SITE_URL || getRequestOrigin(event);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: order.id,
      customer_email: customer.email,
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["IT"] },
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: item.unitPriceCents,
          product_data: {
            name: `${item.productTitle} - ${item.optionLabel}`,
            description: "Creazione artigianale Adornabile in cera profumata.",
          },
        },
      })),
      metadata: {
        order_id: order.id,
        customer_name: customer.fullName,
        customer_phone: customer.phone,
        premium_packaging: customer.premiumPackaging ? "si" : "no",
        topper_theme: customer.topperTheme,
      },
      success_url: `${origin}/#ordine-completato?order=${encodeURIComponent(order.id)}`,
      cancel_url: `${origin}/#checkout?order=${encodeURIComponent(order.id)}`,
    });

    order = {
      ...order,
      paymentUrl: session.url ?? undefined,
    };
    await upsertOrder(order);

    return respond(200, {
      order,
      checkoutUrl: session.url || `/#pagamento?order=${encodeURIComponent(order.id)}`,
      provider: "Stripe Checkout",
      configured: Boolean(session.url),
    });
  } catch (error) {
    return respond(Number(error?.statusCode ?? 500), {
      error: error instanceof Error ? error.message : "Checkout non disponibile.",
    });
  }
};
