import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-gradient-to-b from-white via-purple-50/50 to-white">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-300/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 bg-purple-50 mb-8">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-purple-700 font-medium">AI-Powered Background Removal</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-extrabold leading-tight mb-6 text-gray-900">
          Remove Backgrounds{" "}
          <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">Instantly</span>
          <br />
          with AI Precision
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload any image and get a clean, transparent background in seconds. 
          Powered by cutting-edge AI for pixel-perfect results.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/register">
            <Button className="text-base px-8 py-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-xl hover:shadow-purple-400/50 transition-all duration-300 font-medium">
              <Upload className="w-5 h-5 mr-2" />
              Start Removing Backgrounds
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-medium">
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
              <div className="text-2xl sm:text-3xl font-heading font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Preview card */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="relative rounded-2xl p-2 bg-gradient-to-b from-purple-100/50 to-pink-100/30 border border-purple-200/50 shadow-xl">
            <div className="bg-white rounded-xl h-64 sm:h-80 flex items-center justify-center">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 sm:w-48 sm:h-48 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-300 shadow-md">
                  <span className="text-gray-600 text-sm font-medium">Original</span>
                </div>
                <Zap className="w-8 h-8 text-purple-600 animate-float" />
                <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-xl flex items-center justify-center border border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md">
                  <span className="text-purple-700 text-sm font-medium">No BG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
