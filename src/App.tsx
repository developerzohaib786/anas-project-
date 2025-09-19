import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider } from "@/contexts/ChatContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedAppLayout from "@/components/ProtectedAppLayout";
import { PageLoadingState } from "@/components/ui/loading-state";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { analytics } from "@/lib/analytics";

// Import core pages directly for smooth navigation
import Create from "./pages/Create";
import Enhance from "./pages/Enhance";
import Video from "./pages/Video";
import BrandKit from "./pages/BrandKit";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
// Keep Auth and NotFound lazy since they're accessed less frequently
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <ChatProvider>
              <BrandProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <div className="min-h-screen bg-background transition-colors duration-0">
                    <Suspense fallback={<PageLoadingState message="Loading application..." />}>
                      <Routes>
                        <Route path="/auth" element={<Auth />} />
                        <Route element={<ProtectedAppLayout />}>
                          <Route path="/" element={<Enhance />} />
                          <Route path="/create" element={<Create />} />
                          <Route path="/video" element={<Video />} />
                          <Route path="/chat" element={<Chat />} />
                          <Route path="/chat/:sessionId" element={<Chat />} />
                          <Route path="/brand-kit" element={<BrandKit />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>
                    </Suspense>
                  </div>
                </TooltipProvider>
              </BrandProvider>
            </ChatProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
