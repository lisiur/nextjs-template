import { AppSidebar } from "@/components/layout/sidebar";
import { SidebarBorderTrigger } from "@/components/layout/sidebar-border-trigger";
import { SidebarToggleListener } from "@/components/layout/sidebar-toggle-listener";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <SidebarToggleListener />
      <AppSidebar />
      <SidebarBorderTrigger />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
