"use client";
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
import {
  LayoutDashboard,
  Settings,
  Clock,
  CreditCard,
  Activity,
  Cpu,
  BookOpen,
  Home
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Recents",
    url: "/dashboard/recents",
    icon: Clock,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Plans",
    url: "/dashboard/plans",
    icon: CreditCard,
  },
  {
    title: "Usage & Billing",
    url: "/dashboard/usage",
    icon: Activity,
  },
  {
    title: "Models Configs",
    url: "/dashboard/models",
    icon: Cpu,
  },
  {
    title: "Examples",
    url: "/#examples",
    icon: BookOpen,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="inset"
      style={{
        "--sidebar": "#000000",
        "--sidebar-foreground": "#ffffff",
        "--sidebar-accent": "rgba(255,255,255,0.08)",
        "--sidebar-accent-foreground": "#ffffff",
        "--sidebar-border": "rgba(255,255,255,0.08)",
      } as React.CSSProperties}
      className="text-white !top-[54px] !h-[calc(100vh-54px)]"
    >
      <SidebarHeader>
        <div className="flex h-12 items-center px-4 text-lg font-bold">
          {/* <span className="text-[1.2rem] text-white mr-2 mt-10">✦</span>  */}
          Sketch AI
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                // Exact matches for Home and Overview, startsWith for others
                const isActive = item.url === "/"
                  ? pathname === "/"
                  : item.url === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname?.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="hover:bg-white/10 hover:text-white">
                      {item.url.startsWith("/#") ? (
                        <a href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      ) : (
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-white/40 text-center border-t border-white/10">
          Sketch AI Dashboard
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
