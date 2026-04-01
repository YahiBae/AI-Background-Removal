import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="SnapCut AI" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-bold gradient-text">SnapCut AI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 SnapCut AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
