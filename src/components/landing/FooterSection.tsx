import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <footer className="border-t border-purple-200 bg-gradient-to-b from-white to-purple-50/30 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="SnapCut AI" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">SnapCut AI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <Link to="/privacy" className="hover:text-purple-600 transition-colors duration-200 font-medium">Privacy</Link>
            <Link to="/terms" className="hover:text-purple-600 transition-colors duration-200 font-medium">Terms</Link>
            <a href="#features" className="hover:text-purple-600 transition-colors duration-200 font-medium">Features</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors duration-200 font-medium">Pricing</a>
          </div>
          <p className="text-sm text-gray-600">© 2026 SnapCut AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
