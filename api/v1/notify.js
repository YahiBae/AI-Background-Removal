import { applyCors, requireApiKeyIfConfigured, sendJson } from "./_utils.js";

const EMAIL_WEBHOOK_URL = process.env.EMAIL_PROVIDER_WEBHOOK_URL;
const RESEND_API_URL = "https://api.resend.com/emails";

const sendWithWebhook = async (payload) => {
  const response = await fetch(EMAIL_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Webhook email failed (${response.status})`);
  }
};

const sendWithResend = async ({ to, subject, message }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Email provider is not configured");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Resend request failed (${response.status})`);
  }
};

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

  const to = String(req.body?.to || "").trim().toLowerCase();
  const subject = String(req.body?.subject || "").trim();
  const message = String(req.body?.message || "").trim();

  if (!to || !subject || !message) {
    sendJson(res, 400, { error: "to, subject, and message are required" });
    return;
  }

  try {
    if (EMAIL_WEBHOOK_URL) {
      await sendWithWebhook({ to, subject, message });
    } else {
      await sendWithResend({ to, subject, message });
    }

    sendJson(res, 200, { success: true });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Email delivery failed",
    });
  }
}
