import { useEffect, useRef, useState, useCallback } from "react";
import { Upload, X, Download, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const WEBHOOK_URL = "https://sagarpun.app.n8n.cloud/webhook/remove-background";

const UploadWorkspace = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

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

      setResult(data.url);
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

        {!file ? (
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
        ) : (
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
                  <Button variant="cta" size="lg" className="rounded-xl px-8">
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button variant="cta-outline" size="lg" onClick={reset} className="rounded-xl px-8">
                    Upload Another
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadWorkspace;
