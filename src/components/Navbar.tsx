import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { getCurrentUser, logoutUser } from "@/lib/auth";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const navigate = useNavigate();

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "API", href: "#api" },
  ];

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-200/50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="SnapCut AI" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-heading font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">SnapCut AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <>
              <span className="text-sm text-gray-600">Hi, {currentUser.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">Log in</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-200 transition-all" size="sm">Get Started Free</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-purple-200/50 p-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-sm font-medium text-gray-600 hover:text-purple-600 py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            {currentUser ? (
              <Button variant="ghost" size="sm" className="w-full text-gray-600 hover:text-gray-900" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <>
                <Link to="/login" className="flex-1">
                  <Button variant="ghost" size="sm" className="w-full text-gray-600 hover:text-gray-900">Log in</Button>
                </Link>
                <Link to="/register" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
