import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">AI-Powered Background Removal</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-extrabold leading-tight mb-6">
          Remove Backgrounds{" "}
          <span className="gradient-text">Instantly</span>
          <br />
          with AI Precision
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Upload any image and get a clean, transparent background in seconds. 
          Powered by cutting-edge AI for pixel-perfect results.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/register">
            <Button variant="cta" size="lg" className="text-base px-8 py-6 rounded-xl animate-pulse-glow">
              <Upload className="w-5 h-5 mr-2" />
              Start Removing Backgrounds
            </Button>
          </Link>
          <a href="#features">
            <Button variant="cta-outline" size="lg" className="text-base px-8 py-6 rounded-xl">
              See How It Works
            </Button>
          </a>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
          {[
            { value: "5M+", label: "Images Processed" },
            { value: "<3s", label: "Avg Processing Time" },
            { value: "99.5%", label: "Accuracy Rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-heading font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Preview card */}
        <div className="mt-16 max-w-4xl mx-auto glass-card rounded-2xl p-2 neon-border">
          <div className="bg-muted/30 rounded-xl h-64 sm:h-80 flex items-center justify-center">
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 sm:w-48 sm:h-48 bg-muted/50 rounded-xl flex items-center justify-center border border-border">
                <span className="text-muted-foreground text-sm">Original</span>
              </div>
              <Zap className="w-8 h-8 text-primary animate-float" />
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-xl flex items-center justify-center border border-primary/30" style={{ backgroundImage: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%)', backgroundSize: '16px 16px' }}>
                <span className="text-primary text-sm font-medium">No BG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
