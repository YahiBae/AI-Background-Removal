const DEFAULT_ALLOWED_ORIGINS = "*";

export const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

export const applyCors = (req, res) => {
  const configuredOrigin = process.env.API_ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGINS;
  res.setHeader("Access-Control-Allow-Origin", configuredOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  return false;
};

export const requireApiKeyIfConfigured = (req, res) => {
  const requiredApiKey = process.env.API_SECRET_KEY;
  if (!requiredApiKey) {
    return true;
  }

  const providedApiKey = req.headers["x-api-key"];
  if (providedApiKey !== requiredApiKey) {
    sendJson(res, 401, { error: "Unauthorized" });
    return false;
  }

  return true;
};

export const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const getSupabaseHeaders = () => {
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
};
