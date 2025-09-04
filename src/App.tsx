import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar"; // kept for other usages
import { AppSidebar } from "@/components/AppSidebar"; // kept for other usages
import ProtectedAppLayout from "@/components/ProtectedAppLayout";

import { ChatProvider } from "@/contexts/ChatContext";
import { BrandProvider } from "@/contexts/BrandContext";
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";
import Projects from "./pages/Projects";
import BrandKit from "./pages/BrandKit";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatProvider>
      <BrandProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedAppLayout />}>
                <Route path="/" element={<Chat />} />
                <Route path="/chat/:sessionId" element={<Chat />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/brand-kit" element={<BrandKit />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
        </TooltipProvider>
      </BrandProvider>
    </ChatProvider>
  </QueryClientProvider>
);

export default App;
