import { Zap, Shield, ImageIcon, Code2, CreditCard, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Remove backgrounds in under 3 seconds with our optimized AI pipeline.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Images auto-delete after 24 hours. Your data is never stored permanently.",
  },
  {
    icon: ImageIcon,
    title: "HD Quality",
    description: "Support for images up to 5000x5000px with pixel-perfect edge detection.",
  },
  {
    icon: Code2,
    title: "Developer API",
    description: "RESTful API with SDKs for seamless integration into your workflows.",
  },
  {
    icon: CreditCard,
    title: "Flexible Pricing",
    description: "Free tier with 5 images/day. Pro plans for unlimited processing.",
  },
  {
    icon: Globe,
    title: "Global CDN",
    description: "Fast delivery worldwide with edge caching and optimized delivery.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-purple-50/30 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 text-gray-900">
            Why Choose <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">SnapCut AI</span>?
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-lg">
            Professional-grade background removal powered by state-of-the-art AI.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 border border-purple-100 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-200/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-purple-400/50 transition-all">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
