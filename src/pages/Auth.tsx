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
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-16">
          <h1 className="text-[32px] font-semibold text-[#1d1d1f] tracking-[-0.01em] leading-tight">
            {isSignUp ? 'Create your Nino Account' : 'Sign in to Nino'}
          </h1>
        </div>
        
        <div className="bg-white rounded-[18px] border border-[#e5e5e7] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] mb-8">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-0 border-b border-[#e5e5e7] rounded-none bg-transparent px-5 py-5 text-[17px] font-normal placeholder:text-[#8e8e93] focus-visible:outline-none focus-visible:ring-0 focus:border-[#007aff] transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-0 rounded-none bg-transparent px-5 py-5 pr-16 text-[17px] font-normal placeholder:text-[#8e8e93] focus-visible:outline-none focus-visible:ring-0 transition-all duration-200"
              />
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#007aff] hover:bg-[#0051d5] disabled:bg-[#c7c7cc] disabled:opacity-60 p-0 transition-all duration-200 hover-scale"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.5} />
                )}
              </Button>
            </div>
          </form>
        </div>

        {!isSignUp && (
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="rounded-[4px] border-[#c7c7cc] data-[state=checked]:bg-[#007aff] data-[state=checked]:border-[#007aff]"
              />
              <label 
                htmlFor="remember" 
                className="text-[15px] font-normal text-[#1d1d1f] cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>
          </div>
        )}

        <div className="text-center space-y-8">
          {!isSignUp && (
            <button 
              type="button"
              className="text-[15px] font-normal text-[#007aff] hover:text-[#0051d5] transition-colors duration-200 story-link"
            >
              Forgot password?
            </button>
          )}
          
          <div className="text-[15px] font-normal text-[#8e8e93]">
            {isSignUp ? "Already have a Nino Account? " : "Don't have a Nino Account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail("");
                setPassword("");
              }}
              className="text-[#007aff] hover:text-[#0051d5] transition-colors duration-200 story-link font-normal"
            >
              {isSignUp ? 'Sign in' : 'Create Your Nino Account'}
            </button>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-[13px] text-[#8e8e93] leading-[1.4] font-normal max-w-xs mx-auto">
            By signing {isSignUp ? 'up' : 'in'}, you agree to Nino's{' '}
            <span className="text-[#007aff] hover:text-[#0051d5] cursor-pointer transition-colors duration-200">Terms of Service</span>{' '}
            and{' '}
            <span className="text-[#007aff] hover:text-[#0051d5] cursor-pointer transition-colors duration-200">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}