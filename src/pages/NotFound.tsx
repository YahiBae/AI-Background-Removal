import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-purple-50/30 to-white">
      <div className="text-center px-4">
        <h1 className="mb-4 text-6xl font-heading font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">404</h1>
        <p className="mb-8 text-xl text-gray-700 font-medium">Oops! Page not found</p>
        <a href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-400/50 transition-all">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
