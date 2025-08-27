import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        });

        if (error) {
          toast.error(error.message);
        } else if (data.user && !data.session) {
          // User created but needs email verification
          toast.success("Account created! Check your email to verify and complete setup.");
        } else if (data.session) {
          // User created and logged in (email confirmation disabled)
          toast.success("Account created! Welcome to Nino!");
          navigate("/onboarding");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
        } else if (data.session) {
          // Check if user has completed onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.session.user.id)
            .single();

          if (profile?.onboarding_completed) {
            navigate("/dashboard");
          } else {
            navigate("/onboarding");
          }
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent! Check your inbox.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (profile?.onboarding_completed) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
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
              className="h-14 bg-white border border-gray-200 rounded-t-3xl rounded-b-none border-b-0 px-4 text-base placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 focus:z-10 relative transition-all duration-200"
            />
          </div>
          
          {/* Password Field */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-white border border-gray-200 rounded-b-3xl rounded-t-none px-4 pr-20 text-base placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 focus:z-10 relative transition-all duration-200"
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
              <button
                type="button"
                onClick={handleAuth}
                disabled={loading || !email || !password}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-4 w-4 text-gray-500" />
              </button>
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
            <button 
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-base text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
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