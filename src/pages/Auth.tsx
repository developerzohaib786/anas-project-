import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowRight } from "lucide-react";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn, signUp, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (isSignUp) {
      // For sign up, we'll extract first name from email or use a default
      const emailName = email.split('@')[0];
      await signUp(email, password, emailName, "");
    } else {
      await signIn(email, password);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">
            {isSignUp ? 'Create your Nino Account' : 'Sign in to Nino'}
          </h1>
        </div>
        
        <div className="bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="p-1">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-0 border-b border-[#d2d2d7] rounded-none bg-transparent px-4 py-4 text-[17px] font-medium placeholder:text-[#86868b] focus-visible:outline-none focus-visible:ring-0 focus:border-[#007aff] transition-colors"
              />
            </div>
            <div className="p-1 relative">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-0 rounded-none bg-transparent px-4 py-4 pr-14 text-[17px] font-medium placeholder:text-[#86868b] focus-visible:outline-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#007aff] hover:bg-[#0056d3] disabled:bg-[#86868b] disabled:opacity-50 p-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </form>
        </div>

        {!isSignUp && (
          <div className="flex items-center mt-6 mb-8">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="rounded-sm border-[#86868b]"
            />
            <label 
              htmlFor="remember" 
              className="ml-3 text-[17px] font-medium text-[#1d1d1f] cursor-pointer"
            >
              Remember me
            </label>
          </div>
        )}

        <div className="text-center space-y-6 mt-8">
          {!isSignUp && (
            <button 
              type="button"
              className="text-[17px] font-medium text-[#007aff] hover:underline"
            >
              Forgot password? ↗
            </button>
          )}
          
          <div className="text-[17px] font-medium text-[#86868b]">
            {isSignUp ? "Already have a Nino Account? " : "Don't have a Nino Account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail("");
                setPassword("");
              }}
              className="text-[#007aff] hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Create Your Nino Account'} ↗
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-[13px] text-[#86868b] leading-relaxed">
            By signing {isSignUp ? 'up' : 'in'}, you agree to Nino's{' '}
            <span className="text-[#007aff] hover:underline cursor-pointer">Terms of Service</span>{' '}
            and{' '}
            <span className="text-[#007aff] hover:underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}