import { Home, FolderOpen, Palette, Settings, ChevronRight, User, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  { title: "Chat", url: "/", icon: Home },
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
  const currentPath = location.pathname;
  const { signOut } = useAuth();

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="w-60 bg-white border-r border-gray-200 md:w-60 w-16">
      <div className="flex flex-col h-full">
      <SidebarHeader className="p-4 border-b border-gray-100 md:p-4 p-3">
        <div className="flex items-center gap-3 md:flex hidden">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Four Seasons Oahu" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              FS
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-semibold text-sm text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Four Seasons Oahu
            </div>
            <div className="text-xs text-gray-500 font-normal">
              Workspace
            </div>
          </div>
        </div>
        <div className="md:hidden flex items-center justify-center">
          <Avatar className="h-7 w-7">
            <AvatarImage src="" alt="Four Seasons Oahu" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              FS
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
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects Section - Hidden on mobile */}
        <SidebarGroup className="mt-8 md:block hidden">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Recent
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projectItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm mb-1 ${
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`
                      }
                    >
                      <ChevronRight className="h-3 w-3" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                onClick={() => signOut()}
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