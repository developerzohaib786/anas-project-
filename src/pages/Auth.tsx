import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) throw error;
        
        if (data.user && !data.user.email_confirmed_at) {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your account setup.",
          });
        } else {
          toast({
            title: "Account created successfully",
            description: "Welcome to Nino! You're now logged in.",
          });
          navigate("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google auth error:", error);
      toast({
        title: "Google sign-in failed",
        description: error.message || "Unable to sign in with Google. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="light min-h-screen bg-white text-gray-900 flex items-center justify-center p-4" style={{colorScheme: 'light'}}>
      <style>{`
        /* Force light mode for auth page */
        .light {
          color-scheme: light !important;
          background-color: white !important;
        }
        .light input {
          background-color: white !important;
          border: 1px solid #e5e7eb !important;
          color: #111827 !important;
        }
        .light input:focus {
          border-color: #3b82f6 !important;
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        }
        .light button[class*="bg-primary"] {
          background-color: #111827 !important;
          color: white !important;
        }
        .light button[class*="bg-primary"]:hover {
          background-color: #374151 !important;
        }
        .light .text-muted-foreground {
          color: #6b7280 !important;
        }
        .light h1, .light h2, .light h3, .light p, .light span, .light label {
          color: #111827 !important;
        }
        .light a {
          color: #3b82f6 !important;
        }
        .light a:hover {
          color: #2563eb !important;
        }
      `}</style>
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <img 
            src="/lovable-uploads/941c544f-33d7-4463-a848-f7d47c4cb515.png" 
            alt="Logo" 
            className="mx-auto h-10 w-10 mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-900">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isSignUp ? "Sign up with your Google account" : "Login with your Google account"}
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full h-10 text-sm font-medium"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isSignUp ? "Sign up with Google" : "Login with Google"}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="hello@nino.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              {!isSignUp && (
                <Button variant="link" className="h-auto p-0 text-xs text-gray-500">
                  Forgot your password?
                </Button>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 w-9 px-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
          </div>
          
          <Button type="submit" className="w-full h-9 text-sm font-medium mt-4" disabled={loading}>
            {loading ? "Please wait..." : (isSignUp ? "Create account" : "Login")}
          </Button>
        </form>

        {/* Sign up link */}
        <div className="text-center">
          <span className="text-sm text-gray-600">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
          </span>
          <Button 
            variant="link" 
            className="h-auto p-0 text-sm font-medium"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </Button>
        </div>

        {/* Terms and Privacy */}
        <div className="text-center text-xs text-gray-500">
          By clicking continue, you agree to our{" "}
          <Button variant="link" className="h-auto p-0 text-xs underline">
            Terms of Service
          </Button>{" "}
          and{" "}
          <Button variant="link" className="h-auto p-0 text-xs underline">
            Privacy Policy
          </Button>
          .
        </div>
      </div>
    </div>
  );
};

export default Auth;