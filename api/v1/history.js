import { applyCors, getSupabaseHeaders, requireApiKeyIfConfigured, sendJson } from "./_utils.js";

const getSupabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const TABLE = "image_history";

const mapRow = (row) => ({
  id: row.id,
  ownerEmail: row.owner_email,
  createdAt: row.created_at,
  originalName: row.original_name,
  originalPreview: row.original_preview,
  resultUrl: row.result_url,
});

export default async function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  if (!requireApiKeyIfConfigured(req, res)) {
    return;
  }

  const supabaseUrl = getSupabaseUrl();
  const headers = getSupabaseHeaders();

  if (!supabaseUrl || !headers.apikey) {
    sendJson(res, 500, { error: "Supabase is not configured" });
    return;
  }

  const endpointBase = `${supabaseUrl}/rest/v1/${TABLE}`;

  try {
    if (req.method === "GET") {
      const ownerEmail = String(req.query?.ownerEmail || "").trim().toLowerCase();
      const limit = Number(req.query?.limit || 30);

      if (!ownerEmail) {
        sendJson(res, 400, { error: "ownerEmail is required" });
        return;
      }

      const endpoint = `${endpointBase}?select=id,owner_email,created_at,original_name,original_preview,result_url&owner_email=eq.${encodeURIComponent(ownerEmail)}&order=created_at.desc&limit=${Math.max(1, Math.min(100, limit))}`;
      const response = await fetch(endpoint, { method: "GET", headers });

      if (!response.ok) {
        const errorText = await response.text();
        sendJson(res, response.status, { error: errorText || "Failed to load history" });
        return;
      }

      const rows = await response.json();
      sendJson(res, 200, {
        success: true,
        items: Array.isArray(rows) ? rows.map(mapRow) : [],
      });
      return;
    }

    if (req.method === "POST") {
      const { ownerEmail, items } = req.body || {};

      if (!ownerEmail || !Array.isArray(items)) {
        sendJson(res, 400, { error: "ownerEmail and items are required" });
        return;
      }

      const normalizedOwner = String(ownerEmail).trim().toLowerCase();
      const deleteResponse = await fetch(`${endpointBase}?owner_email=eq.${encodeURIComponent(normalizedOwner)}`, {
        method: "DELETE",
        headers: {
          ...headers,
          Prefer: "return=minimal",
        },
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        sendJson(res, deleteResponse.status, { error: errorText || "Failed to clear old history" });
        return;
      }

      if (items.length === 0) {
        sendJson(res, 200, { success: true, saved: 0 });
        return;
      }

      const payload = items.map((item) => ({
        id: item.id,
        owner_email: normalizedOwner,
        created_at: item.createdAt,
        original_name: item.originalName,
        original_preview: item.originalPreview,
        result_url: item.resultUrl,
      }));

      const insertResponse = await fetch(endpointBase, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        sendJson(res, insertResponse.status, { error: errorText || "Failed to save history" });
        return;
      }

      sendJson(res, 200, { success: true, saved: payload.length });
      return;
    }

    if (req.method === "DELETE") {
      const ownerEmail = String(req.query?.ownerEmail || req.body?.ownerEmail || "").trim().toLowerCase();

      if (!ownerEmail) {
        sendJson(res, 400, { error: "ownerEmail is required" });
        return;
      }

      const deleteResponse = await fetch(`${endpointBase}?owner_email=eq.${encodeURIComponent(ownerEmail)}`, {
        method: "DELETE",
        headers: {
          ...headers,
          Prefer: "return=minimal",
        },
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        sendJson(deleteResponse.status, { error: errorText || "Failed to clear history" });
        return;
      }

      sendJson(res, 200, { success: true });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}
