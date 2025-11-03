import { 
  Building2, 
  Users, 
  Truck, 
  UserCheck, 
  Bell, 
  FileText, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Shield,
  MapPin,
  PhoneCall
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "./role-badge";
import { Badge } from "./ui/badge";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Define menu items based on role
  const getMenuItemsByRole = () => {
    if (!user) return [];

    const baseItems = [
      {
        title: "Seleção de Filial",
        url: "/filial",
        icon: Building2,
        roles: ["porteiro", "cliente", "gestor"],
      },
    ];

    const porteiroItems = [
      {
        title: "Portaria",
        url: "/portaria",
        icon: Truck,
        roles: ["porteiro"],
      },
      {
        title: "Mapa de Vagas",
        url: "/vagas",
        icon: MapPin,
        roles: ["porteiro"],
      },
      {
        title: "Visitantes",
        url: "/visitantes",
        icon: UserCheck,
        roles: ["porteiro"],
      },
      {
        title: "Chamadas",
        url: "/chamadas",
        icon: Bell,
        roles: ["porteiro"],
      },
    ];

    const clienteItems = [
      {
        title: "Dashboard",
        url: "/cliente",
        icon: LayoutDashboard,
        roles: ["cliente"],
      },
      {
        title: "Mapa de Vagas",
        url: "/vagas",
        icon: MapPin,
        roles: ["cliente"],
      },
      {
        title: "Chamadas",
        url: "/cliente-chamadas",
        icon: PhoneCall,
        roles: ["cliente"],
      },
      {
        title: "Relatórios",
        url: "/relatorios",
        icon: FileText,
        roles: ["cliente"],
      },
    ];

    const gestorItems = [
      {
        title: "Gestão",
        url: "/gestao",
        icon: Shield,
        roles: ["gestor"],
      },
      {
        title: "Usuários",
        url: "/usuarios",
        icon: Users,
        roles: ["gestor"],
      },
      {
        title: "Filiais",
        url: "/filiais",
        icon: Building2,
        roles: ["gestor"],
      },
      {
        title: "Auditoria",
        url: "/auditoria",
        icon: FileText,
        roles: ["gestor"],
      },
    ];

    const allItems = [...baseItems, ...porteiroItems, ...clienteItems, ...gestorItems];
    return allItems.filter(item => item.roles.includes(user.role));
  };

  const menuItems = getMenuItemsByRole();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary">
            <Truck className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">RETROPATIO</span>
            <span className="text-xs text-sidebar-foreground/60">Controle de Pátio</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-sidebar-foreground/60">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
                    className="hover-elevate"
                    data-testid={`nav-${item.url.substring(1)}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user && (
          <div className="space-y-3">
            <div className="flex flex-col gap-1 rounded-md bg-sidebar-accent p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-sidebar-accent-foreground">{user.nome}</span>
                <RoleBadge role={user.role} />
              </div>
              <span className="text-xs text-sidebar-accent-foreground/60">{user.email}</span>
            </div>
            
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="w-full hover-elevate text-destructive"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
