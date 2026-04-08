export type HistoryRecord = {
  id: string;
  createdAt: string;
  originalName: string;
  originalPreview: string;
  resultUrl: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const tableEndpoint = () => `${SUPABASE_URL}/rest/v1/image_history`;

const buildHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
});

const normalizeRemoteRows = (rows: Array<Record<string, unknown>>): HistoryRecord[] =>
  rows.map((row) => ({
    id: String(row.id ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    originalName: String(row.original_name ?? "image"),
    originalPreview: String(row.original_preview ?? ""),
    resultUrl: String(row.result_url ?? ""),
  }));

export const isHistoryDatabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const loadHistoryFromDatabase = async (ownerEmail: string, limit: number) => {
  if (!isHistoryDatabaseConfigured()) {
    return [] as HistoryRecord[];
  }

  const response = await fetch(
    `${tableEndpoint()}?select=id,created_at,original_name,original_preview,result_url&owner_email=eq.${encodeURIComponent(ownerEmail)}&order=created_at.desc&limit=${limit}`,
    {
      method: "GET",
      headers: buildHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`History load failed (${response.status}).`);
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return normalizeRemoteRows(rows);
};

export const saveHistoryToDatabase = async (ownerEmail: string, items: HistoryRecord[]) => {
  if (!isHistoryDatabaseConfigured()) {
    return;
  }

  const clearResponse = await fetch(`${tableEndpoint()}?owner_email=eq.${encodeURIComponent(ownerEmail)}`, {
    method: "DELETE",
    headers: {
      ...buildHeaders(),
      Prefer: "return=minimal",
    },
  });

  if (!clearResponse.ok) {
    throw new Error(`History clear failed (${clearResponse.status}).`);
  }

  if (items.length === 0) {
    return;
  }

  const payload = items.map((item) => ({
    id: item.id,
    owner_email: ownerEmail,
    created_at: item.createdAt,
    original_name: item.originalName,
    original_preview: item.originalPreview,
    result_url: item.resultUrl,
  }));

  const saveResponse = await fetch(tableEndpoint(), {
    method: "POST",
    headers: {
      ...buildHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!saveResponse.ok) {
    throw new Error(`History save failed (${saveResponse.status}).`);
  }
};

export const clearHistoryInDatabase = async (ownerEmail: string) => {
  if (!isHistoryDatabaseConfigured()) {
    return;
  }

  const response = await fetch(`${tableEndpoint()}?owner_email=eq.${encodeURIComponent(ownerEmail)}`, {
    method: "DELETE",
    headers: {
      ...buildHeaders(),
      Prefer: "return=minimal",
    },
  });

  if (!response.ok) {
    throw new Error(`History clear failed (${response.status}).`);
  }
};
