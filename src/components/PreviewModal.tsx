import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type SocialPreset = {
  key: string;
  label: string;
  width: number;
  height: number;
};

type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

const SOCIAL_PRESETS: SocialPreset[] = [
  { key: "original", label: "Original Size", width: 0, height: 0 },
  { key: "instagram-post", label: "Instagram Post (1080 x 1080)", width: 1080, height: 1080 },
  { key: "instagram-story", label: "Instagram Story (1080 x 1920)", width: 1080, height: 1920 },
  { key: "youtube-thumb", label: "YouTube Thumbnail (1280 x 720)", width: 1280, height: 720 },
  { key: "linkedin-post", label: "LinkedIn Post (1200 x 627)", width: 1200, height: 627 },
  { key: "facebook-post", label: "Facebook Post (1200 x 630)", width: 1200, height: 630 },
  { key: "x-post", label: "X Post (1600 x 900)", width: 1600, height: 900 },
  { key: "tiktok-cover", label: "TikTok Cover (1080 x 1920)", width: 1080, height: 1920 },
];

interface PreviewModalProps {
  originalImage: string;
  resultImage: string;
  originalName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (editedBlob?: Blob) => void;
  isDownloading: boolean;
}

const PreviewModal = ({
  originalImage,
  resultImage,
  originalName,
  isOpen,
  onClose,
  onDownload,
  isDownloading,
}: PreviewModalProps) => {
  const [zoom, setZoom] = useState(100);
  const [activeImage, setActiveImage] = useState<"original" | "result">("result");
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [cropPercent, setCropPercent] = useState(100);
  const [opacity, setOpacity] = useState(100);
  const [blur, setBlur] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [socialPresetKey, setSocialPresetKey] = useState("original");
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("SnapBackground Enterprise");
  const [watermarkOpacity, setWatermarkOpacity] = useState(35);
  const [watermarkSize, setWatermarkSize] = useState(5);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>("bottom-right");
  const [preparingDownload, setPreparingDownload] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentImage = activeImage === "original" ? originalImage : resultImage;
  const selectedPreset = SOCIAL_PRESETS.find((preset) => preset.key === socialPresetKey) ?? SOCIAL_PRESETS[0];
  const cropInset = Math.max(0, (100 - cropPercent) / 2);
  const imageFilter = `blur(${blur}px) brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg)`;

  const getWatermarkPreviewPosition = () => {
    switch (watermarkPosition) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "center":
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      case "bottom-right":
      default:
        return "bottom-4 right-4";
    }
  };

  const resetEdits = () => {
    setZoom(100);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setCropPercent(100);
    setOpacity(100);
    setBlur(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHueRotate(0);
    setSocialPresetKey("original");
    setWatermarkEnabled(false);
    setWatermarkText("SnapBackground Enterprise");
    setWatermarkOpacity(35);
    setWatermarkSize(5);
    setWatermarkPosition("bottom-right");
  };

  const handleEditedDownload = async () => {
    setPreparingDownload(true);

    try {
      const response = await fetch(currentImage);
      if (!response.ok) {
        throw new Error("Could not load preview image for export.");
      }

      const sourceBlob = await response.blob();
      const bitmap = await createImageBitmap(sourceBlob);

      const baseCanvas = document.createElement("canvas");
      baseCanvas.width = bitmap.width;
      baseCanvas.height = bitmap.height;
      const baseCtx = baseCanvas.getContext("2d");

      if (!baseCtx) {
        bitmap.close();
        onDownload();
        return;
      }

      baseCtx.save();
      baseCtx.translate(baseCanvas.width / 2, baseCanvas.height / 2);
      baseCtx.rotate((rotation * Math.PI) / 180);
      baseCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      baseCtx.globalAlpha = opacity / 100;
      baseCtx.filter = imageFilter;
      baseCtx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2, bitmap.width, bitmap.height);
      baseCtx.restore();
      bitmap.close();

      const cropScale = Math.max(0.5, cropPercent / 100);
      const cropWidth = Math.max(1, Math.round(baseCanvas.width * cropScale));
      const cropHeight = Math.max(1, Math.round(baseCanvas.height * cropScale));
      const cropX = Math.max(0, Math.round((baseCanvas.width - cropWidth) / 2));
      const cropY = Math.max(0, Math.round((baseCanvas.height - cropHeight) / 2));

      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = cropWidth;
      outputCanvas.height = cropHeight;
      const outputCtx = outputCanvas.getContext("2d");

      if (!outputCtx) {
        onDownload();
        return;
      }

      outputCtx.drawImage(
        baseCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );
      let exportCanvas = outputCanvas;

      if (selectedPreset.width > 0 && selectedPreset.height > 0) {
        const socialCanvas = document.createElement("canvas");
        socialCanvas.width = selectedPreset.width;
        socialCanvas.height = selectedPreset.height;
        const socialCtx = socialCanvas.getContext("2d");

        if (socialCtx) {
          const scale = Math.min(
            selectedPreset.width / outputCanvas.width,
            selectedPreset.height / outputCanvas.height,
          );
          const drawWidth = Math.round(outputCanvas.width * scale);
          const drawHeight = Math.round(outputCanvas.height * scale);
          const offsetX = Math.round((selectedPreset.width - drawWidth) / 2);
          const offsetY = Math.round((selectedPreset.height - drawHeight) / 2);

          socialCtx.drawImage(outputCanvas, offsetX, offsetY, drawWidth, drawHeight);
          exportCanvas = socialCanvas;
        }
      }

      if (watermarkEnabled && watermarkText.trim()) {
        const watermarkCtx = exportCanvas.getContext("2d");
        if (watermarkCtx) {
          const baseSize = Math.max(16, Math.round((Math.min(exportCanvas.width, exportCanvas.height) * watermarkSize) / 100));
          const margin = Math.max(12, Math.round(baseSize * 0.8));
          const cleanText = watermarkText.trim();

          watermarkCtx.save();
          watermarkCtx.globalAlpha = watermarkOpacity / 100;
          watermarkCtx.fillStyle = "#ffffff";
          watermarkCtx.strokeStyle = "rgba(0, 0, 0, 0.45)";
          watermarkCtx.lineWidth = Math.max(2, Math.round(baseSize / 10));
          watermarkCtx.font = `700 ${baseSize}px Poppins, sans-serif`;
          watermarkCtx.textAlign = "left";
          watermarkCtx.textBaseline = "alphabetic";

          const textWidth = watermarkCtx.measureText(cleanText).width;
          let x = margin;
          let y = exportCanvas.height - margin;

          if (watermarkPosition === "top-left") {
            x = margin;
            y = margin + baseSize;
          } else if (watermarkPosition === "top-right") {
            x = exportCanvas.width - textWidth - margin;
            y = margin + baseSize;
          } else if (watermarkPosition === "bottom-left") {
            x = margin;
            y = exportCanvas.height - margin;
          } else if (watermarkPosition === "center") {
            x = (exportCanvas.width - textWidth) / 2;
            y = exportCanvas.height / 2;
          } else {
            x = exportCanvas.width - textWidth - margin;
            y = exportCanvas.height - margin;
          }

          watermarkCtx.strokeText(cleanText, x, y);
          watermarkCtx.fillText(cleanText, x, y);
          watermarkCtx.restore();
        }
      }

      const editedBlob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, "image/png");
      });

      onDownload(editedBlob ?? undefined);
    } catch {
      onDownload();
    } finally {
      setPreparingDownload(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-purple-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-gray-900">Image Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Image Display */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center relative"
            style={{
              backgroundImage:
                "repeating-conic-gradient(#f3f4f6 0% 25%, #e5e7eb 0% 50%)",
              backgroundSize: "16px 16px",
            }}
          >
            <img
              src={currentImage}
              alt={activeImage === "original" ? "Original" : "Result"}
              className="object-contain"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
                clipPath: `inset(${cropInset}% ${cropInset}% ${cropInset}% ${cropInset}%)`,
                opacity: opacity / 100,
                filter: imageFilter,
                transition: "transform 0.2s ease",
              }}
            />

            {watermarkEnabled && watermarkText.trim() ? (
              <div
                className={`pointer-events-none absolute ${getWatermarkPreviewPosition()} text-white font-semibold tracking-wide`}
                style={{
                  opacity: watermarkOpacity / 100,
                  fontSize: `${Math.max(10, watermarkSize * 3)}px`,
                  textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
                }}
              >
                {watermarkText}
              </div>
            ) : null}
          </div>

          {/* Tabs */}
          <div className="border-t border-purple-100 bg-white p-3 flex gap-2">
            <button
              onClick={() => {
                setActiveImage("original");
                resetEdits();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeImage === "original"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => {
                setActiveImage("result");
                resetEdits();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeImage === "result"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Result
            </button>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="border-t border-purple-100 p-4 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: Zoom & Rotation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-2 hover:bg-white rounded-lg transition text-gray-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <div className="bg-white rounded-lg px-3 py-1 border border-purple-200 text-sm font-medium min-w-12 text-center">
                {zoom}%
              </div>

              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-2 hover:bg-white rounded-lg transition text-gray-600"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 hover:bg-white rounded-lg transition text-gray-600 ml-2"
                title="Rotate 90°"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setFlipX((prev) => !prev)}
                className="text-xs font-medium px-3 py-1 bg-white hover:bg-gray-100 rounded-lg transition text-gray-600 border border-gray-200"
                title="Flip Horizontal"
              >
                Flip H
              </button>

              <button
                onClick={() => setFlipY((prev) => !prev)}
                className="text-xs font-medium px-3 py-1 bg-white hover:bg-gray-100 rounded-lg transition text-gray-600 border border-gray-200"
                title="Flip Vertical"
              >
                Flip V
              </button>

              <button
                onClick={resetEdits}
                className="text-xs font-medium px-3 py-1 bg-white hover:bg-gray-100 rounded-lg transition text-gray-600 border border-gray-200"
              >
                Reset
              </button>
            </div>

            {/* Right: Download Button */}
            <Button
              onClick={handleEditedDownload}
              disabled={isDownloading || preparingDownload}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-400/50 rounded-lg font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isDownloading || preparingDownload ? "Downloading..." : "Download Edited"}
            </Button>
          </div>

          {/* Zoom Slider */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-gray-600 font-medium">Zoom Level:</span>
            <input
              type="range"
              min="50"
              max="200"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-gray-600 font-medium">Crop:</span>
            <input
              type="range"
              min="50"
              max="100"
              value={cropPercent}
              onChange={(e) => setCropPercent(Number(e.target.value))}
              className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-xs text-gray-600 font-medium min-w-10 text-right">{cropPercent}%</span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-gray-600 font-medium min-w-28">Social Size:</span>
            <select
              value={socialPresetKey}
              onChange={(event) => setSocialPresetKey(event.target.value)}
              className="flex-1 rounded-lg border border-purple-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none"
            >
              {SOCIAL_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-16">Opacity</span>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-16">Blur</span>
              <input
                type="range"
                min="0"
                max="20"
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-16">Brightness</span>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-16">Contrast</span>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-16">Saturation</span>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-16">Hue</span>
              <input
                type="range"
                min="0"
                max="360"
                value={hueRotate}
                onChange={(e) => setHueRotate(Number(e.target.value))}
                className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-purple-200 bg-white/80 p-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Enterprise Watermark</p>
              <button
                type="button"
                onClick={() => setWatermarkEnabled((prev) => !prev)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  watermarkEnabled ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {watermarkEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium min-w-20">Text</span>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="flex-1 rounded-lg border border-purple-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none"
                  placeholder="Watermark text"
                  disabled={!watermarkEnabled}
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium min-w-20">Position</span>
                <select
                  value={watermarkPosition}
                  onChange={(e) => setWatermarkPosition(e.target.value as WatermarkPosition)}
                  className="flex-1 rounded-lg border border-purple-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none"
                  disabled={!watermarkEnabled}
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="center">Center</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <label className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium min-w-20">Opacity</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  disabled={!watermarkEnabled}
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium min-w-20">Size</span>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={watermarkSize}
                  onChange={(e) => setWatermarkSize(Number(e.target.value))}
                  className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  disabled={!watermarkEnabled}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
