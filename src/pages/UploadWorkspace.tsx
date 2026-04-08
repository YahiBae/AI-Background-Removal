import { useEffect, useRef, useState, useCallback } from "react";
import { Upload, X, Download, Loader2, ImageIcon, History, Eye, Palette } from "lucide-react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import PreviewModal from "@/components/PreviewModal";
import BackgroundReplacer from "@/components/BackgroundReplacer";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import {
  clearHistoryInDatabase,
  isHistoryDatabaseConfigured,
  loadHistoryFromDatabase,
  saveHistoryToDatabase,
} from "@/lib/historyDatabase";

const WEBHOOK_URL = "https://sagarpun.app.n8n.cloud/webhook/remove-background";
const HISTORY_STORAGE_KEY = "snap-background-history";
const HISTORY_LIMIT = 30;

type HistoryItem = {
  id: string;
  createdAt: string;
  originalName: string;
  originalPreview: string;
  resultUrl: string;
};

type ExportFormat = "png" | "webp" | "jpeg" | "gif" | "tiff";

const EXPORT_FORMATS: Array<{ value: ExportFormat; label: string; mime: string }> = [
  { value: "png", label: "PNG", mime: "image/png" },
  { value: "webp", label: "WEBP", mime: "image/webp" },
  { value: "jpeg", label: "JPEG", mime: "image/jpeg" },
  { value: "gif", label: "GIF", mime: "image/gif" },
  { value: "tiff", label: "TIFF", mime: "image/tiff" },
];

const makeDownloadName = (originalName: string) => {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base}-no-bg.png`;
};

const makeExportName = (originalName: string, format: ExportFormat) => {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base}-no-bg.${format === "jpeg" ? "jpg" : format}`;
};

const normalizeImageUrl = (url: string) => {
  if (!url) return url;

  // Prevent mixed-content blocks on deployed HTTPS sites.
  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }

  return url;
};

const UploadWorkspace = () => {
  const currentUser = getCurrentUser();
  const ownerEmail = currentUser?.email ?? "guest@snapcut.local";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "batch" | "history">("workspace");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewModalData, setPreviewModalData] = useState<{
    original: string;
    result: string;
    name: string;
  } | null>(null);
  const [showBackgroundReplacer, setShowBackgroundReplacer] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchZipDownloading, setBatchZipDownloading] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [batchProgress, setBatchProgress] = useState<Record<string, { processed: boolean; url: string | null }>>({});
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      let loadedFromDatabase = false;

      if (isHistoryDatabaseConfigured()) {
        try {
          const remoteItems = await loadHistoryFromDatabase(ownerEmail, HISTORY_LIMIT);
          if (!cancelled && remoteItems.length > 0) {
            const normalizedRemote = remoteItems.map((item) => ({
              ...item,
              resultUrl: normalizeImageUrl(String(item.resultUrl)),
            }));
            setHistoryItems(normalizedRemote);
            window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(normalizedRemote));
            loadedFromDatabase = true;
          }
        } catch {
          toast({
            title: "Database unavailable",
            description: "Using local history cache for now.",
            variant: "destructive",
          });
        }
      }

      if (loadedFromDatabase) {
        return;
      }

      try {
        const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as HistoryItem[];
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((item) => ({
            ...item,
            resultUrl: normalizeImageUrl(String(item.resultUrl)),
          }));
          if (!cancelled) {
            setHistoryItems(normalized);
            window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(normalized));
          }
        }
      } catch {
        toast({ title: "History reset", description: "Could not load saved history.", variant: "destructive" });
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [ownerEmail, toast]);

  const saveHistory = useCallback(async (items: HistoryItem[]) => {
    setHistoryItems(items);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));

    if (isHistoryDatabaseConfigured()) {
      try {
        await saveHistoryToDatabase(ownerEmail, items);
      } catch {
        toast({
          title: "Database sync failed",
          description: "Saved locally; cloud sync will retry on next update.",
          variant: "destructive",
        });
      }
    }
  }, [ownerEmail, toast]);

  const handleFile = useCallback((f: File) => {
    if (!ALLOWED.includes(f.type)) {
      toast({ title: "Invalid format", description: "Only JPG, PNG, WEBP allowed.", variant: "destructive" });
      return false;
    }
    if (f.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max size is 10MB.", variant: "destructive" });
      return false;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
    return true;
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const pastedItems = Array.from(event.clipboardData?.items ?? []);
    const pastedFile = pastedItems
      .map((item) => item.getAsFile())
      .find((item) => item && ALLOWED.includes(item.type));

    if (!pastedFile) {
      return;
    }

    event.preventDefault();
    if (handleFile(pastedFile)) {
      toast({ title: "Image pasted", description: "Clipboard image added successfully." });
    }
  }, [handleFile, toast]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-File-Name": encodeURIComponent(file.name),
        },
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Webhook request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Webhook response missing image URL.");
      }

      const resultUrl = normalizeImageUrl(String(data.url));
      setResult(resultUrl);

      if (preview) {
        const item: HistoryItem = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          originalName: file.name,
          originalPreview: preview,
          resultUrl,
        };
        void saveHistory([item, ...historyItems].slice(0, HISTORY_LIMIT));
      }

      toast({ title: "Done!", description: "Background removed successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to process the image.";
      toast({ title: "Processing failed", description: message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleBatchUpload = (files: File[]) => {
    const validFiles = files.filter(
      (f) => ALLOWED.includes(f.type) && f.size <= MAX_SIZE
    );

    if (validFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "Please select JPG, PNG, or WEBP images under 10MB.",
        variant: "destructive",
      });
      return;
    }

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files skipped",
        description: `${files.length - validFiles.length} file(s) were skipped due to format or size.`,
      });
    }

    setBatchFiles(validFiles);
    const progress: Record<string, { processed: boolean; url: string | null }> = {};
    validFiles.forEach((f) => {
      progress[f.name] = { processed: false, url: null };
    });
    setBatchProgress(progress);
  };

  const processBatch = async () => {
    if (batchFiles.length === 0) return;

    setBatchProcessing(true);
    const newHistoryItems: HistoryItem[] = [];
    const processedProgress = { ...batchProgress };

    for (const file of batchFiles) {
      try {
        // Generate preview for batch file
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        // Process image
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
            "X-File-Name": encodeURIComponent(file.name),
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.url) {
          throw new Error("No URL in response");
        }

        const resultUrl = normalizeImageUrl(String(data.url));
        processedProgress[file.name] = { processed: true, url: resultUrl };
        setBatchProgress({ ...processedProgress });

        // Add to history
        const historyItem: HistoryItem = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          originalName: file.name,
          originalPreview: preview,
          resultUrl,
        };
        newHistoryItems.push(historyItem);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        processedProgress[file.name] = { processed: false, url: null };
        setBatchProgress({ ...processedProgress });
      }
    }

    // Save all to history
    if (newHistoryItems.length > 0) {
      void saveHistory([...newHistoryItems, ...historyItems].slice(0, HISTORY_LIMIT));
      toast({
        title: "Batch complete!",
        description: `${newHistoryItems.length}/${batchFiles.length} images processed successfully.`,
      });
    }

    setBatchProcessing(false);
  };

  const handleBatchDownloadZip = useCallback(async () => {
    const processedItems = batchFiles
      .map((batchFile) => ({
        name: batchFile.name,
        url: batchProgress[batchFile.name]?.url,
      }))
      .filter((item): item is { name: string; url: string } => Boolean(item.url));

    if (processedItems.length === 0) {
      toast({
        title: "No processed files",
        description: "Process files first, then download them as ZIP.",
        variant: "destructive",
      });
      return;
    }

    setBatchZipDownloading(true);
    try {
      const zip = new JSZip();
      const usedNames = new Map<string, number>();

      for (const item of processedItems) {
        const response = await fetch(normalizeImageUrl(item.url));
        if (!response.ok) {
          throw new Error(`Failed to fetch ${item.name}`);
        }

        const blob = await response.blob();
        const baseName = makeDownloadName(item.name);
        const count = usedNames.get(baseName) ?? 0;
        usedNames.set(baseName, count + 1);
        const fileName = count === 0 ? baseName : `${baseName.replace(/\.png$/i, "")}-${count + 1}.png`;
        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const objectUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `batch-no-bg-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      toast({
        title: "ZIP downloaded",
        description: `${processedItems.length} image(s) were bundled successfully.`,
      });
    } catch {
      toast({
        title: "ZIP download failed",
        description: "Could not create ZIP file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBatchZipDownloading(false);
    }
  }, [batchFiles, batchProgress, toast]);

  const handleDownload = useCallback(async (imageUrl: string | null, originalName: string, id = "current", format: ExportFormat = "png", sourceBlob?: Blob) => {
    setDownloadingId(id);

    try {
      let inputBlob = sourceBlob;

      if (!inputBlob) {
        if (!imageUrl) {
          throw new Error("No image available to download.");
        }

        const imageResponse = await fetch(normalizeImageUrl(imageUrl));
        if (!imageResponse.ok) {
          throw new Error(`Download failed with status ${imageResponse.status}`);
        }

        inputBlob = await imageResponse.blob();
      }

      let blob = inputBlob;

      if (format !== "png") {
        const mime = EXPORT_FORMATS.find((item) => item.value === format)?.mime;
        if (!mime) {
          throw new Error("Unsupported export format.");
        }

        const bitmap = await createImageBitmap(inputBlob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const context = canvas.getContext("2d");
        if (!context) {
          bitmap.close();
          throw new Error("Canvas export unavailable.");
        }

        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const convertedBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, mime, 0.95);
        });

        if (!convertedBlob) {
          throw new Error(`${format.toUpperCase()} export is not supported in this browser.`);
        }

        blob = convertedBlob;
      }

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = format === "png" ? makeDownloadName(originalName) : makeExportName(originalName, format);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      toast({
        title: "Downloaded",
        description: `Saved as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not download automatically. Please try again.";
      toast({
        title: "Download failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  }, [toast]);

  const handleBackgroundReplacerDownload = useCallback(
    (blob: Blob, filename: string) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast({
        title: "Downloaded",
        description: "Image with new background saved successfully.",
      });
      setShowBackgroundReplacer(false);
    },
    [toast]
  );

  const clearHistory = async () => {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistoryItems([]);

    if (isHistoryDatabaseConfigured()) {
      try {
        await clearHistoryInDatabase(ownerEmail);
      } catch {
        toast({
          title: "Cloud clear failed",
          description: "Local history cleared, but cloud records could not be removed.",
          variant: "destructive",
        });
      }
    }

    toast({ title: "History cleared", description: "Saved uploads were removed." });
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2">
            <span className="gradient-text">Upload</span> Your Image
          </h1>
          <p className="text-muted-foreground">Drag & drop, browse files, or paste an image to remove the background</p>
        </div>

        <div className="max-w-4xl mx-auto mb-6 flex justify-center">
          <div className="glass-card rounded-xl p-1 inline-flex gap-1">
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "workspace" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("workspace")}
            >
              Workspace
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 ${
                activeTab === "batch" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("batch")}
            >
              📦 Batch
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 ${
                activeTab === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("history")}
            >
              <History className="w-4 h-4" />
              History ({historyItems.length})
            </button>
          </div>
        </div>

        {activeTab === "batch" ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-purple-200 p-8 text-center">
              <h2 className="text-2xl font-heading font-bold mb-4 text-gray-900">Batch Upload Processing</h2>
              <p className="text-gray-600 mb-6">Upload multiple images at once and process them all together</p>
              
              {batchFiles.length === 0 ? (
                <>
                  <button
                    onClick={() => batchFileInputRef.current?.click()}
                    className="w-full py-12 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-400 transition text-center text-gray-600 hover:text-gray-900 hover:bg-purple-50"
                  >
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-lg font-medium mb-1">Click to upload images</p>
                    <p className="text-sm text-gray-500">Or drag and drop multiple files</p>
                  </button>
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleBatchUpload(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </>
              ) : (
                <>
                  <div className="mb-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">Files to Process: {batchFiles.length}</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {batchFiles.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-purple-100"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xl">
                              {batchProgress[f.name]?.processed ? (
                                <span className="text-green-600">✓</span>
                              ) : batchProcessing ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <span className="text-gray-400">⊙</span>
                              )}
                            </span>
                            <span className="text-sm font-medium text-gray-700 truncate">{f.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            {(f.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setBatchFiles([]);
                        setBatchProgress({});
                      }}
                      variant="outline"
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                      disabled={batchProcessing}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={processBatch}
                      disabled={batchProcessing}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-400/50 font-medium"
                    >
                      {batchProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Start Processing"
                      )}
                    </Button>
                    <Button
                      onClick={handleBatchDownloadZip}
                      disabled={batchProcessing || batchZipDownloading || !batchFiles.some((f) => Boolean(batchProgress[f.name]?.url))}
                      className="flex-1 bg-gradient-to-r from-fuchsia-600 to-indigo-500 text-white hover:shadow-lg hover:shadow-fuchsia-400/50 font-medium"
                    >
                      {batchZipDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating ZIP...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download ZIP
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : activeTab === "workspace" && !file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`max-w-2xl mx-auto glass-card rounded-2xl p-16 text-center transition-all ${
              dragOver ? "neon-border scale-[1.02]" : "border border-dashed border-border hover:border-primary/50"
            }`}
          >
            <Upload className="w-12 h-12 text-primary mx-auto mb-4 animate-float" />
            <p className="text-lg font-medium mb-2">Drop your image here</p>
            <p className="text-sm text-muted-foreground mb-4">
              or{" "}
              <span
                role="button"
                tabIndex={0}
                className="text-primary cursor-pointer hover:underline"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                browse files
              </span>
              {" "}or paste with ⌘V / Ctrl+V
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP • Max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];
                if (selectedFile) {
                  handleFile(selectedFile);
                }
                event.target.value = "";
              }}
            />
          </div>
        ) : activeTab === "workspace" ? (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Original</span>
                  <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden bg-muted/20 aspect-square flex items-center justify-center">
                  <img src={preview!} alt="Original" className="max-w-full max-h-full object-contain" />
                </div>
              </div>

              {/* Result */}
              <div className="glass-card rounded-2xl p-4 neon-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-primary">Result</span>
                </div>
                <div
                  className="rounded-xl overflow-hidden aspect-square flex items-center justify-center"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%)',
                    backgroundSize: '16px 16px',
                  }}
                >
                  {processing ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Removing background...</p>
                    </div>
                  ) : result ? (
                    <img src={result} alt="Result" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click process to start</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              {!result ? (
                <Button variant="cta" size="lg" onClick={handleProcess} disabled={processing} className="rounded-xl px-8">
                  {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {processing ? "Processing..." : "Remove Background"}
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-xl border border-purple-200 px-3 py-2 bg-white/80">
                    <span className="text-sm font-medium text-purple-700">Format</span>
                    <select
                      value={exportFormat}
                      onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                      className="text-sm bg-transparent outline-none"
                    >
                      {EXPORT_FORMATS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-400/50 rounded-xl px-8"
                    size="lg"
                    onClick={() => {
                      setPreviewModalData({
                        original: preview!,
                        result: result!,
                        name: file?.name || "image",
                      });
                      setShowPreviewModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-400/50 rounded-xl px-8"
                    size="lg"
                    onClick={() => setShowBackgroundReplacer(true)}
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Replace Background
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-400/50 rounded-xl px-8"
                    size="lg"
                    onClick={() => handleDownload(result, file?.name ?? "image", "current", exportFormat)}
                    disabled={downloadingId === "current"}
                  >
                    {downloadingId === "current" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download {exportFormat.toUpperCase()}
                  </Button>
                  <Button variant="outline" size="lg" onClick={reset} className="rounded-xl px-8 border-purple-200 text-purple-700 hover:bg-purple-50">
                    Upload Another
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Processing History</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-purple-200 px-3 py-1.5 bg-white/80">
                  <span className="text-xs font-medium text-purple-700">Format</span>
                  <select
                    value={exportFormat}
                    onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                    className="text-xs bg-transparent outline-none"
                  >
                    {EXPORT_FORMATS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button variant="cta-outline" size="sm" onClick={clearHistory} disabled={historyItems.length === 0}>
                  Clear History
                </Button>
              </div>
            </div>

            {historyItems.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium mb-1">No history yet</p>
                <p className="text-sm text-muted-foreground">Process an image in Workspace to see it saved here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyItems.map((item) => (
                  <div key={item.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium">{item.originalName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewModalData({
                              original: item.originalPreview,
                              result: item.resultUrl,
                              name: item.originalName,
                            });
                            setShowPreviewModal(true);
                          }}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                          size="sm"
                          onClick={() => handleDownload(item.resultUrl, item.originalName, item.id, exportFormat)}
                          disabled={downloadingId === item.id}
                        >
                          {downloadingId === item.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          {exportFormat.toUpperCase()}
                        </Button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-xl overflow-hidden bg-muted/20 aspect-square flex items-center justify-center">
                        <img src={item.originalPreview} alt="Original" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div
                        className="rounded-xl overflow-hidden aspect-square flex items-center justify-center"
                        style={{
                          backgroundImage: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%)',
                          backgroundSize: '16px 16px',
                        }}
                      >
                        <img src={item.resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <PreviewModal
        isOpen={showPreviewModal && !!previewModalData}
        onClose={() => setShowPreviewModal(false)}
        originalImage={previewModalData?.original || ""}
        resultImage={previewModalData?.result || ""}
        originalName={previewModalData?.name || "image"}
        onDownload={(editedBlob) => {
          handleDownload(previewModalData?.result || null, previewModalData?.name || "image", "current", exportFormat, editedBlob);
          setShowPreviewModal(false);
        }}
        isDownloading={downloadingId === "current"}
      />

      <BackgroundReplacer
        isOpen={showBackgroundReplacer}
        onClose={() => setShowBackgroundReplacer(false)}
        resultImage={result || ""}
        originalName={file?.name || "image"}
        onDownload={handleBackgroundReplacerDownload}
      />
    </div>
  );
};

export default UploadWorkspace;
