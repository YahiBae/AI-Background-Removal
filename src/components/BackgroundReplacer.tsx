import { useEffect, useRef, useState } from "react";
import { X, Download, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackgroundReplacerProps {
  resultImage: string;
  originalName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (blob: Blob, filename: string) => void;
}

const PRESET_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
  { name: "Transparent", value: "transparent" },
  { name: "Gray", value: "#808080" },
  { name: "Blue", value: "#0066CC" },
  { name: "Green", value: "#00CC00" },
  { name: "Red", value: "#CC0000" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Purple", value: "#800080" },
  { name: "Pink", value: "#FF69B4" },
];

const BackgroundReplacer = ({
  resultImage,
  originalName,
  isOpen,
  onClose,
  onDownload,
}: BackgroundReplacerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"color" | "image">("color");
  const [customColor, setCustomColor] = useState("#FFFFFF");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawComposite();
    }
  }, [isOpen, backgroundColor, backgroundImage, resultImage]);

  const drawComposite = async () => {
    if (!canvasRef.current || !resultImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // Load the main image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw background
        if (activeTab === "color") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (backgroundImage) {
          // Draw background image
          const bgImg = new Image();
          bgImg.crossOrigin = "anonymous";
          bgImg.onload = () => {
            // Stretch background to fit
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            // Draw main image on top
            ctx.drawImage(img, 0, 0);
          };
          bgImg.onerror = () => {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          bgImg.src = backgroundImage;
          return;
        }

        // Draw the PNG with transparency on top
        ctx.drawImage(img, 0, 0);
      };
      img.src = resultImage;
    } catch (error) {
      console.error("Error drawing composite:", error);
    }
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);
    try {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const dotIndex = originalName.lastIndexOf(".");
          const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
          const filename = `${base}-with-bg.png`;
          onDownload(blob, filename);
        }
        setIsProcessing(false);
      }, "image/png");
    } catch (error) {
      console.error("Download error:", error);
      setIsProcessing(false);
    }
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBackgroundImage(result);
      setActiveTab("image");
    };
    reader.readAsDataURL(file);
  };

  const copyColorCode = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-purple-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-gray-900">Replace Background</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Preview */}
          <div className="flex-1 border-b lg:border-b-0 lg:border-r border-purple-100 p-6 flex flex-col">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
            <div
              className="flex-1 rounded-xl overflow-auto flex items-center justify-center bg-gray-50"
              style={{
                backgroundImage: activeTab === "color" 
                  ? `repeating-conic-gradient(#f3f4f6 0% 25%, #e5e7eb 0% 50%)`
                  : undefined,
                backgroundSize: "16px 16px",
              }}
            >
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="w-full lg:w-80 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-purple-100">
                <button
                  onClick={() => setActiveTab("color")}
                  className={`px-4 py-2 font-medium text-sm transition ${
                    activeTab === "color"
                      ? "border-b-2 border-purple-600 text-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Solid Color
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`px-4 py-2 font-medium text-sm transition ${
                    activeTab === "image"
                      ? "border-b-2 border-purple-600 text-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Image
                </button>
              </div>

              {activeTab === "color" ? (
                <>
                  {/* Color Picker */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Custom Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => {
                          setCustomColor(e.target.value);
                          setBackgroundColor(e.target.value);
                        }}
                        className="w-12 h-10 rounded-lg cursor-pointer border border-purple-200"
                      />
                      <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 rounded-lg border border-purple-200">
                        <code className="text-sm font-mono text-gray-600">{customColor}</code>
                        <button
                          onClick={() => copyColorCode(customColor)}
                          className="text-gray-400 hover:text-gray-600 transition ml-auto"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preset Colors */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Preset Colors
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            setBackgroundColor(color.value);
                            setCustomColor(color.value);
                          }}
                          className={`p-3 rounded-lg border-2 transition ${
                            backgroundColor === color.value
                              ? "border-purple-600"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          style={
                            color.value === "transparent"
                              ? {
                                  backgroundImage:
                                    "repeating-conic-gradient(#f3f4f6 0% 25%, #e5e7eb 0% 50%)",
                                  backgroundSize: "8px 8px",
                                }
                              : { backgroundColor: color.value }
                          }
                        >
                          <span
                            className={`text-xs font-medium ${
                              color.value === "transparent" ||
                              color.value === "#FFFFFF" ||
                              color.value === "#FFFF00"
                                ? "text-gray-700"
                                : "text-white"
                            }`}
                          >
                            {color.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Background Image Upload */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Upload Background Image
                    </label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-purple-200 rounded-lg hover:border-purple-400 transition text-center text-sm text-gray-600 hover:text-gray-900"
                    >
                      {backgroundImage ? "Change Image" : "Click to Upload"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundImageUpload}
                      className="hidden"
                    />
                  </div>

                  {backgroundImage && (
                    <button
                      onClick={() => {
                        setBackgroundImage(null);
                        setActiveTab("color");
                      }}
                      className="w-full py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove Background Image
                    </button>
                  )}
                </>
              )}

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-400/50 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundReplacer;
