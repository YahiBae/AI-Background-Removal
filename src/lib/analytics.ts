const ANALYTICS_KEY = "snap-analytics-events";
const MAX_EVENTS = 2000;

export type ProcessingEvent = {
  id: string;
  createdAt: string;
  fileName: string;
  fileSizeBytes: number;
  durationMs: number;
  success: boolean;
  mode: "single" | "batch";
};

const safeRead = (): ProcessingEvent[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(ANALYTICS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ProcessingEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWrite = (events: ProcessingEvent[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
};

export const getProcessingEvents = () => safeRead();

export const trackProcessingEvent = (event: Omit<ProcessingEvent, "id" | "createdAt">) => {
  const fullEvent: ProcessingEvent = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...event,
  };

  const previous = safeRead();
  safeWrite([fullEvent, ...previous]);
};

export const clearProcessingEvents = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ANALYTICS_KEY);
};
