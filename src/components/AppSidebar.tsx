import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Tag,
  History,
  BarChart3,
  MapPin,
} from "lucide-react";
import logo from "@/assets/logo-bumpside.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
];

const manageItems = [
  { title: "Categorias", url: "/admin/categorias", icon: Tag },
  { title: "Fornecedores", url: "/admin/fornecedores", icon: Truck },
  { title: "Revendedores", url: "/admin/revendedores", icon: MapPin },
  { title: "Movimentação", url: "/admin/movimentacao", icon: History },
  { title: "Relatórios", url: "/admin/relatorios", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild tooltip={item.title}>
        <NavLink
          to={item.url}
          end={item.url === "/admin"}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {collapsed ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
            <Package className="h-5 w-5 text-background" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <img src={logo} alt="BUMPSIDE BRASIL" className="h-10 w-auto object-contain" />
            <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Estoque
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Gestão</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{manageItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}