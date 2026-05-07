import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AppLayout() {
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4">
            <SidebarTrigger />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Admin</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
              Ver loja
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}