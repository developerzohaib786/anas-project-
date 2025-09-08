import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider } from "@/contexts/ChatContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedAppLayout from "@/components/ProtectedAppLayout";
import { PageLoadingState } from "@/components/ui/loading-state";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { analytics } from "@/lib/analytics";

// Lazy load pages for better performance
const Create = lazy(() => import("./pages/Create"));
const Enhance = lazy(() => import("./pages/Enhance"));
const Video = lazy(() => import("./pages/Video"));
const BrandKit = lazy(() => import("./pages/BrandKit"));
const Settings = lazy(() => import("./pages/Settings"));
const Chat = lazy(() => import("./pages/Chat"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ChatProvider>
          <BrandProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
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
              </BrowserRouter>
            </TooltipProvider>
          </BrandProvider>
        </ChatProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
