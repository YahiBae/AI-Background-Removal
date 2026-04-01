import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center glass-card rounded-2xl p-8 neon-border">
        <h1 className="text-2xl font-heading font-bold mb-3">Password reset</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This local demo stores accounts in your browser, so password reset is not available.
          Use the email and password you registered with, or create a new account.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/login">
            <Button variant="ghost">Back to sign in</Button>
          </Link>
          <Link to="/register">
            <Button variant="cta">Create account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
