import { applyCors, readRawBody, requireApiKeyIfConfigured, sendJson } from "./_utils.js";

const DEFAULT_WEBHOOK_URL = "https://sagarpun.app.n8n.cloud/webhook/remove-background";

export default async function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  if (!requireApiKeyIfConfigured(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const contentType = req.headers["content-type"] || "application/octet-stream";
    const fileName = req.headers["x-file-name"] || "upload-image";
    const body = await readRawBody(req);

    if (!body || body.length === 0) {
      sendJson(res, 400, { error: "Missing request body" });
      return;
    }

    const webhookUrl = process.env.REMOVE_BG_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
    const upstreamResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "X-File-Name": fileName,
      },
      body,
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      sendJson(res, upstreamResponse.status, {
        error: errorText || `Upstream error (${upstreamResponse.status})`,
      });
      return;
    }

    const data = await upstreamResponse.json();
    sendJson(res, 200, {
      success: true,
      data,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}
