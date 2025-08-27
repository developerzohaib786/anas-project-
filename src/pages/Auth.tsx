import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isSignUp ? "Create your Nino Account" : "Sign in to Nino"}
          </h1>
        </div>

        {/* Connected Form Fields */}
        <div className="mb-6">
          {/* Email Field */}
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 bg-white border border-gray-200 rounded-t-lg rounded-b-none border-b-0 px-4 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:z-10 relative"
            />
          </div>
          
          {/* Password Field */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-white border border-gray-200 rounded-b-lg rounded-t-none px-4 pr-20 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:z-10 relative"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Remember Me - Only show on sign in */}
        {!isSignUp && (
          <div className="flex items-center space-x-3 mb-6">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-gray-300"
            />
            <label
              htmlFor="remember"
              className="text-base text-gray-600 cursor-pointer"
            >
              Remember me
            </label>
          </div>
        )}

        {/* Forgot Password - Only show on sign in */}
        {!isSignUp && (
          <div className="text-center mb-10">
            <button className="text-base text-gray-500 hover:text-gray-700 transition-colors">
              Forgot password?
            </button>
          </div>
        )}

        {/* Sign Up/Sign In Toggle */}
        <div className="text-center mb-12">
          <p className="text-base text-gray-500 mb-1">
            {isSignUp ? "Already have a Nino Account?" : "Don't have a Nino Account?"}
          </p>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-base text-gray-700 hover:text-gray-900 transition-colors font-medium"
          >
            {isSignUp ? "Sign in" : "Create Your Nino Account"}
          </button>
        </div>

        {/* Terms and Privacy */}
        <div className="text-center">
          <p className="text-sm text-gray-400 leading-relaxed">
            By {isSignUp ? "signing up" : "signing in"}, you agree to Nino's{" "}
            <button className="text-gray-600 hover:text-gray-800 transition-colors">
              Terms of Service
            </button>{" "}
            and{" "}
            <button className="text-gray-600 hover:text-gray-800 transition-colors">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;