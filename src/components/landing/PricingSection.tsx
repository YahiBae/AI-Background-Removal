import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "Perfect for trying out",
    features: ["5 images/day", "Standard quality", "JPG & PNG support", "Web dashboard"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "9.99",
    period: "/month",
    description: "For professionals",
    features: ["Unlimited images", "HD quality output", "All formats (JPG, PNG, WEBP)", "Priority processing", "API access", "Bulk upload"],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams & businesses",
    features: ["Everything in Pro", "Dedicated API limits", "Custom integrations", "SLA guarantee", "Priority support", "Volume discounts"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 text-gray-900">
            Simple, Transparent <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-lg">
            Start free. Scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 flex flex-col transition-all duration-300 ${
                plan.highlighted
                  ? "border-2 border-purple-400 bg-gradient-to-b from-purple-50/50 to-pink-50/30 shadow-xl shadow-purple-200/50 relative scale-105 sm:scale-100 lg:scale-105"
                  : "border border-purple-100 bg-white hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-heading font-bold mb-1 text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-heading font-bold text-gray-900">
                  {plan.price === "Custom" ? "" : "$"}{plan.price}
                </span>
                <span className="text-gray-600 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button
                  className={`w-full rounded-xl font-medium transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-400/50"
                      : "border-2 border-purple-200 text-purple-700 hover:bg-purple-50 bg-white"
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
