import { Paintbrush, FolderOpen, Palette, Settings, ChevronRight, User, LogOut, MessageSquare, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useBrand } from "@/contexts/BrandContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "New Project", url: "/", icon: Paintbrush },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Brand Kit", url: "/brand-kit", icon: Palette },
];

const projectItems = [
  { title: "Summer Campaign", url: "/project/summer-campaign" },
  { title: "Product Launch", url: "/project/product-launch" },
  { title: "Brand Refresh", url: "/project/brand-refresh" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const { sessions, deleteSession, createSession } = useChat();
  const { brandProfile, profile } = useBrand();
  const isActive = (path: string) => currentPath === path;
  const brandName = brandProfile?.brand_name || "Your Brand";
  
  // Use the user's profile photo, not brand logo
  const avatarUrl = profile?.avatar_url;
    
  const initials = brandName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    deleteSession(sessionId);
  };

  const handleNewProject = () => {
    // If we're already on a chat page, create a new session
    if (currentPath.startsWith('/chat/')) {
      const newSessionId = createSession();
      navigate(`/chat/${newSessionId}`);
    } else {
      // Otherwise navigate to the home page
      navigate('/');
    }
  };

  return (
    <Sidebar className="w-60 bg-white border-r border-gray-200 md:w-60 w-16">
      <div className="flex flex-col h-full">
      <SidebarHeader className="p-4 border-b border-gray-100 md:p-4 p-3">
        <div className="flex items-center gap-3 md:flex hidden min-w-0">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={avatarUrl || ""} alt={brandName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="font-semibold text-sm text-gray-900 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
              {brandName}'s
            </div>
            <div className="text-xs text-gray-500 font-normal">
              Workspace
            </div>
          </div>
        </div>
        <div className="md:hidden flex items-center justify-center">
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarUrl || ""} alt={brandName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 flex-1 md:px-4 px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.title === "New Project" ? (
                      <button
                        onClick={handleNewProject}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm mb-1 md:justify-start justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full text-left`}
                        title={item.title}
                      >
                        <item.icon className="h-4 w-4 md:mr-0 mr-0" />
                        <span className="md:block hidden">{item.title}</span>
                      </button>
                    ) : (
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm mb-1 md:justify-start justify-center ${
                            isActive
                              ? "bg-gray-900 text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`
                        }
                        title={item.title}
                      >
                        <item.icon className="h-4 w-4 md:mr-0 mr-0" />
                        <span className="md:block hidden">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats Section */}
        {sessions.length > 0 && (
          <SidebarGroup className="mt-8 md:block hidden">
            <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Recent Chats
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {sessions.slice(0, 8).map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <div className="group relative">
                      <NavLink
                        to={`/chat/${session.id}`}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm w-full ${
                            isActive
                              ? "bg-gray-900 text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`
                        }
                        title={session.title}
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          {!session.isCompleted && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mr-2" />
                          )}
                          <span className="truncate flex-1">{session.title}</span>
                        </div>
                      </NavLink>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-100 text-red-500 hover:text-red-700"
                        title="Delete chat"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100 mt-auto md:p-4 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm md:justify-start justify-center ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="md:block hidden">Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={async () => {
                  try {
                    // Clean up any existing auth state
                    Object.keys(localStorage).forEach((key) => {
                      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
                        localStorage.removeItem(key);
                      }
                    });
                    
                    // Sign out with global scope
                    await signOut();
                    
                    // Force page reload for clean state
                    window.location.href = '/auth';
                  } catch (error) {
                    console.error('Error signing out:', error);
                    // Force logout even if there's an error
                    window.location.href = '/auth';
                  }
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm md:justify-start justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="md:block hidden">Sign Out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      </div>
    </Sidebar>
  );
}