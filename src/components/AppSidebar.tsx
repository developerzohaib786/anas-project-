import { Paintbrush, FolderOpen, Palette, Settings, ChevronRight, User, LogOut, Moon, Sun, Film, Edit3, Plus } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useChat } from "@/contexts/ChatContext";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ChatActionsMenu } from "@/components/ChatActionsMenu";
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
  { title: "Enhance Photo", url: "/", icon: Paintbrush },
  { title: "Chat to Create", url: "/create", icon: Edit3 },
  { title: "Image to Video", url: "/video", icon: Film },
  { title: "Brand Assets", url: "/brand-kit", icon: Palette },
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
  
  const { sessions, deleteSession, createSession, renameSession, currentSessionId, setCurrentSession, isLoading } = useChat();

  // Determine which page a session should open on based on its title
  const getSessionRoute = (session: any) => {
    const title = session.title.toLowerCase();
    if (title.includes('enhancement') || title.includes('photo')) {
      return `/`;
    } else if (title.includes('video')) {
      return `/video`;
    } else if (title.includes('creative') || title.includes('chat')) {
      return `/create`;
    }
    // Default to enhance page for older sessions
    return `/`;
  };
  const { brandProfile, profile } = useBrand();
  const { theme, toggleTheme } = useTheme();
  const isActive = (path: string) => currentPath === path;
  const brandName = brandProfile?.brand_name || "Your Brand";
  
  // Use the brand's logo from onboarding, fallback to user profile photo
  const avatarUrl = brandProfile?.logo_url || profile?.avatar_url;
    
  const initials = brandName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

  const handleDeleteSession = (sessionId: string) => {
    // Check if we're deleting the currently viewed session
    const isCurrentSession = currentPath === `/chat/${sessionId}`;
    
    deleteSession(sessionId);
    
    // If we deleted the current session, navigate to home
    if (isCurrentSession) {
      navigate('/');
    }
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    renameSession(sessionId, newTitle);
  };

  const handleNewProject = () => {
    // Check if current session is already empty - if so, don't create a new one
    const currentSession = sessions.find(s => s.id === currentSessionId);
    
    if (currentSession) {
      // Check if current session is empty (only has default assistant message or no messages)
      const hasUserMessages = currentSession.messages.some(m => m.role === 'user');
      const isEmptySession = !hasUserMessages && currentSession.messages.length <= 1;
      
      if (isEmptySession) {
        // Already on empty session - stay here
        navigate(`/chat/${currentSession.id}`);
        return;
      }
    } else if (!currentSessionId) {
      // No current session at all - navigate to root which will create one
      navigate('/');
      return;
    }
    
    // Only create new session if current one has content
    const newSessionId = createSession("New Chat");
    setCurrentSession(newSessionId);
    navigate(`/chat/${newSessionId}`);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <Sidebar className="w-60 bg-background border-r border-border h-screen flex-shrink-0">
      <div className="flex flex-col h-full overflow-hidden">
      <SidebarHeader className="p-4 border-b border-border md:p-4 p-3">
        <div className="flex items-center gap-3 md:flex hidden min-w-0">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={avatarUrl || ""} alt={brandName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="font-semibold text-sm text-foreground truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
              {brandName}'s
            </div>
            <div className="text-xs text-muted-foreground font-normal">
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

      <SidebarContent className="px-4 py-6 flex-1 md:px-4 px-2 flex flex-col overflow-hidden">
        {/* Main Navigation - Fixed */}
        <SidebarGroup className="flex-shrink-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={async () => {
                        // Create a new session when navigating to main pages
                        const newSessionId = await createSession(item.title);
                        setCurrentSession(newSessionId);
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm mb-1 md:justify-start justify-center w-full text-left ${
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        }`
                      }
                      title={item.title}
                    >
                      <item.icon className="h-4 w-4 md:mr-0 mr-0" />
                      <span className="md:block hidden font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Projects Section - Scrollable */}
        <SidebarGroup className="mt-8 md:block hidden flex-1 min-h-0">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Projects
          </SidebarGroupLabel>
          <SidebarGroupContent className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Loading chat history...
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Start chatting to create!
              </div>
            ) : (
              <SidebarMenu className="space-y-1">
                {sessions.map((session) => {
                  // Get the first user message with images for thumbnail
                  const firstImageMessage = session.messages?.find(msg => 
                    msg.role === 'user' && msg.images && msg.images.length > 0
                  );
                  const thumbnailImage = firstImageMessage?.images?.[0];

                  return (
                    <SidebarMenuItem key={session.id}>
                      <div className="group relative">
                        <NavLink
                          to={`/chat/${session.id}`}
                          className={() => {
                            const isCurrentSession = currentSessionId === session.id;
                            return `flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm w-full text-foreground hover:bg-accent hover:text-accent-foreground ${
                              isCurrentSession ? "bg-accent text-accent-foreground" : ""
                            }`;
                          }}
                          title={session.title}
                        >
                          <div className="flex items-center min-w-0 flex-1 gap-3">
                            {thumbnailImage && (
                              <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                                <img 
                                  src={thumbnailImage.url} 
                                  alt="Chat thumbnail"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Hide image if it fails to load
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <span className="truncate flex-1 pr-8">{session.title}</span>
                          </div>
                        </NavLink>
                        <ChatActionsMenu
                          sessionId={session.id}
                          sessionTitle={session.title}
                          onDelete={deleteSession}
                          onRename={renameSession}
                        />
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border mt-auto md:p-4 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm md:justify-start justify-center text-foreground hover:bg-accent hover:text-accent-foreground w-full text-left font-medium"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Sun className="h-4 w-4" strokeWidth={1.5} />
                )}
                <span className="md:block hidden font-medium">
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={() => navigate('/settings')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm md:justify-start justify-center w-full text-left font-medium ${
                  location.pathname === '/settings'
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                title="Settings"
              >
                <Settings className="h-4 w-4" strokeWidth={1.5} />
                <span className="md:block hidden font-medium">Settings</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm md:justify-start justify-center text-foreground hover:bg-accent hover:text-accent-foreground w-full text-left font-medium"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                <span className="md:block hidden font-medium">Log Out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      </div>
    </Sidebar>
  );
}