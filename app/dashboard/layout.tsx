import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#0a0a0a]">
        <DashboardSidebar />
        <SidebarInset className="flex-1 overflow-auto bg-[#0d0d0d] rounded-tl-xl border-t border-l border-white/5">
          <header className="flex h-14 items-center gap-4 border-b border-white/5 bg-[#0d0d0d] px-6 lg:h-[60px]">
            <SidebarTrigger className="hover:bg-white/10" />
            <div className="w-full flex-1">
              <h1 className="text-lg font-semibold text-white/90">Dashboard</h1>
            </div>
          </header>
          <main className="p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
