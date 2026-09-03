import { readJson, readOrders, readText, respond } from "../lib/shared.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Metodo non consentito." });
  }

  try {
    const payload = readJson(event);
    const username = readText(payload.username, 80);
    const password = readText(payload.password, 120);
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return respond(500, { error: "Area admin non configurata." });
    }

    if (username !== adminUsername || password !== adminPassword) {
      return respond(401, { error: "Credenziali non valide." });
    }

    const orders = await readOrders();
    orders.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    return respond(200, { orders });
  } catch (error) {
    return respond(Number(error?.statusCode ?? 500), {
      error: error instanceof Error ? error.message : "Ordini non disponibili.",
    });
  }
};
