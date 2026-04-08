import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, registerUser } from "@/lib/auth";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (getCurrentUser()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = registerUser(name, email, password);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Account created. Redirecting to your dashboard.");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/images/logo.png" alt="SnapCut AI" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-heading font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">SnapCut AI</span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-600 mt-1">Start removing backgrounds for free</p>
        </div>

        <div className="rounded-2xl p-6 border border-purple-200 bg-white shadow-lg shadow-purple-100/50">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="name" placeholder="John Doe" className="pl-10 bg-gray-50 border-purple-200 text-gray-900" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10 bg-gray-50 border-purple-200 text-gray-900" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-10 bg-gray-50 border-purple-200 text-gray-900" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <Button className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-400/50 font-medium" type="submit">Create Account</Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
