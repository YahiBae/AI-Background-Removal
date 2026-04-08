import { applyCors, requireApiKeyIfConfigured, sendJson } from "./_utils.js";

const inferCategory = (name) => {
  const normalized = name.toLowerCase();
  if (/shoe|shirt|dress|product|item|catalog|ecom/.test(normalized)) return "ecommerce";
  if (/profile|portrait|headshot|avatar|person/.test(normalized)) return "portrait";
  if (/logo|icon|brand|mark/.test(normalized)) return "logo";
  if (/story|reel|short|tiktok|instagram/.test(normalized)) return "social";
  return "general";
};

const buildSuggestion = ({ fileName = "image", width = 1024, height = 1024 }) => {
  const category = inferCategory(fileName);
  const portrait = height > width;

  const base = {
    title: "Balanced Clean Cut",
    reason: "General-purpose suggestion based on filename and image shape.",
    exportFormat: "png",
    socialPresetKey: "original",
    watermarkEnabled: false,
    watermarkText: "SnapBackground Enterprise",
    filters: {
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hueRotate: 0,
      opacity: 100,
    },
  };

  if (category === "ecommerce") {
    return {
      ...base,
      title: "E-commerce Product Ready",
      reason: "Detected product-style naming. Optimized for marketplace cards and clean edges.",
      socialPresetKey: "instagram-post",
      watermarkEnabled: true,
      filters: { ...base.filters, contrast: 108, saturation: 108 },
    };
  }

  if (category === "portrait") {
    return {
      ...base,
      title: "Portrait Highlight",
      reason: "Detected portrait/headshot naming. Improved face clarity and social crop.",
      socialPresetKey: portrait ? "instagram-story" : "linkedin-post",
      filters: { ...base.filters, brightness: 106, contrast: 104, saturation: 110 },
    };
  }

  if (category === "logo") {
    return {
      ...base,
      title: "Logo Transparency Pack",
      reason: "Detected logo/icon naming. Preserves transparency and sharp edges.",
      exportFormat: "png",
      socialPresetKey: "original",
      watermarkEnabled: false,
      filters: { ...base.filters, contrast: 112, saturation: 102 },
    };
  }

  if (category === "social") {
    return {
      ...base,
      title: "Social Story Boost",
      reason: "Detected social content naming. Story-first composition with vivid output.",
      socialPresetKey: portrait ? "instagram-story" : "x-post",
      filters: { ...base.filters, brightness: 104, saturation: 116 },
    };
  }

  return {
    ...base,
    socialPresetKey: portrait ? "instagram-story" : "youtube-thumb",
  };
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

  const fileName = String(req.body?.fileName || "image");
  const width = Number(req.body?.width || 1024);
  const height = Number(req.body?.height || 1024);

  const suggestion = buildSuggestion({ fileName, width, height });
  sendJson(res, 200, { success: true, suggestion });
}
