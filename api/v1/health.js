import { applyCors, sendJson } from "./_utils.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  sendJson(res, 200, {
    status: "ok",
    service: "snap-background-api",
    timestamp: new Date().toISOString(),
  });
}
