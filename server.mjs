import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const dataDir = path.join(__dirname, "data");
const ordersFile = path.join(dataDir, "orders.json");
const freeShippingThresholdCents = 8000;

await loadEnvFile();

const port = Number(process.env.PORT ?? 4173);
const adminUsername = process.env.ADMIN_USERNAME ?? "adornabile";
const adminPassword = process.env.ADMIN_PASSWORD ?? "valeria8";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const catalog = {
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

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", getOrigin(request));

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(response, url);
  } catch (error) {
    const statusCode = Number(error?.statusCode ?? 500);
    sendJson(response, statusCode, {
      error: error instanceof Error ? error.message : "Errore inatteso.",
    });
  }
});

server.listen(port, () => {
  console.log(`Adornabile ecommerce pronto su http://localhost:${port}`);
  console.log(stripe ? "Stripe Checkout attivo." : "Stripe non configurato: aggiungi STRIPE_SECRET_KEY in .env.");
});

async function loadEnvFile() {
  try {
    const envFile = await readFile(path.join(__dirname, ".env"), "utf8");

    for (const line of envFile.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // The server can run without a .env file; Stripe simply stays disabled.
  }
}

async function handleApi(request, response, url) {
  if (request.method === "POST" && url.pathname === "/api/checkout") {
    const payload = await readRequestJson(request);
    const items = validateCartItems(payload.items);
    const customer = validateCustomer(payload.customer);
    const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
    let order = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      items,
      customer,
      subtotalCents,
      totalCents: subtotalCents,
      status: "In attesa di pagamento",
      paymentProvider: "Pagamento locale",
      shippingNote: getShippingNote(subtotalCents),
    };
    let checkoutUrl = `/#pagamento?order=${encodeURIComponent(order.id)}`;
    let configured = false;
    let provider = "Pagamento locale";

    if (stripe) {
      try {
        const origin = process.env.PUBLIC_SITE_URL ?? getOrigin(request);
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

        if (session.url) {
          checkoutUrl = session.url;
          configured = true;
          provider = "Stripe Checkout";
          order = {
            ...order,
            paymentProvider: provider,
            paymentUrl: session.url,
          };
        }
      } catch {
        order = {
          ...order,
          status: "Ordine salvato - Stripe non configurato",
        };
      }
    }

    await upsertOrder(order);
    sendJson(response, 200, { order, checkoutUrl, provider, configured });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin/orders") {
    const payload = await readRequestJson(request);
    const username = readText(payload.username, 80);
    const password = readText(payload.password, 120);

    if (username !== adminUsername || password !== adminPassword) {
      sendJson(response, 401, { error: "Credenziali non valide." });
      return;
    }

    const orders = await readOrders();
    orders.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    sendJson(response, 200, { orders });
    return;
  }

  sendJson(response, 404, { error: "API non trovata." });
}

async function serveStatic(response, url) {
  if (!existsSync(distDir)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Cartella dist non trovata. Esegui npm run build prima di avviare il server.");
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  let filePath = path.normalize(path.join(distDir, pathname));
  if (!filePath.startsWith(distDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Percorso non consentito.");
    return;
  }

  if (!existsSync(filePath)) {
    filePath = path.join(distDir, "index.html");
  }

  const fileStat = await stat(filePath);
  if (fileStat.isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(response);
}

function getOrigin(request) {
  const host = request.headers.host ?? `localhost:${port}`;
  const forwardedProto = String(request.headers["x-forwarded-proto"] ?? "").split(",")[0];
  const protocol = forwardedProto || "http";
  return `${protocol}://${host}`;
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        const error = new Error("Richiesta troppo grande.");
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        const error = new Error("JSON non valido.");
        error.statusCode = 400;
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throwBadRequest("Il carrello è vuoto.");
  }

  return items.map((item) => {
    const product = catalog[readText(item.productId, 80)];
    if (!product) throwBadRequest("Prodotto non valido.");

    const optionId = readText(item.optionId, 80);
    const option = product.options[optionId];
    if (!option) throwBadRequest("Variante non valida.");

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throwBadRequest("Quantità non valida.");
    }

    return {
      productId: readText(item.productId, 80),
      productTitle: product.title,
      optionId,
      optionLabel: option.label,
      unitPriceCents: option.priceCents,
      quantity,
      lineTotalCents: option.priceCents * quantity,
    };
  });
}

function validateCustomer(customerPayload) {
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

function readText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function throwBadRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function createOrderId() {
  return `AD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function getShippingNote(subtotalCents) {
  return subtotalCents >= freeShippingThresholdCents
    ? "Spedizione gratuita applicata"
    : "Spedizione da confermare dopo l'ordine";
}

async function ensureOrdersFile() {
  await mkdir(dataDir, { recursive: true });

  if (!existsSync(ordersFile)) {
    await writeFile(ordersFile, "[]\n", "utf8");
  }
}

async function readOrders() {
  await ensureOrdersFile();
  const rawOrders = await readFile(ordersFile, "utf8");

  try {
    const parsedOrders = JSON.parse(rawOrders);
    return Array.isArray(parsedOrders) ? parsedOrders : [];
  } catch {
    return [];
  }
}

async function upsertOrder(order) {
  const orders = await readOrders();
  const nextOrders = [order, ...orders.filter((savedOrder) => savedOrder.id !== order.id)];
  const temporaryFile = `${ordersFile}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(nextOrders, null, 2)}\n`, "utf8");
  await rename(temporaryFile, ordersFile);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}
