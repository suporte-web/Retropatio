import {
  Building2,
  Users,
  Truck,
  UserCheck,
  Bell,
  FileText,
  LogOut,
  LayoutDashboard,
  Shield,
  MapPin,
  PhoneCall,
  Monitor,
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
import { useAuth } from "@/contexts/AuthContext";
import { RoleBadge } from "./role-badge";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const role = user?.role;
  if (!role) return null;

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  // ================================================
  //  MENUS POR PERFIL (ROLE EM MAIÚSCULO)
  // ================================================
  const getMenuItemsByRole = () => {
    const baseItems = [
      {
        title: "Seleção de Filial",
        url: "/filial-selection",
        icon: Building2,
        roles: ["PORTEIRO", "CLIENTE", "GESTOR", "ADMIN"],
      },
    ];

  const sharedItems = [
  {
        title: "Mapa de Vagas",
        url: "/vagas",
        icon: MapPin,
        roles: ["PORTEIRO", "CLIENTE", "GESTOR", "ADMIN"],
          },
    ];


    const porteiroItems = [
      { title: "Portaria", url: "/portaria", icon: Truck, roles: ["PORTEIRO"] },
      
      { title: "Visitantes", url: "/visitantes", icon: UserCheck, roles: ["PORTEIRO"] },
      { title: "Chamadas", url: "/chamadas", icon: Bell, roles: ["PORTEIRO"] },
      { title: "Fornecedores", url: "/fornecedores", icon: Users, roles: ["PORTEIRO"] },
      { title: "Motoristas", url: "/motoristas", icon: Truck, roles: ["PORTEIRO"] },
      { title: "Veículos", url: "/veiculos-cadastro", icon: Truck, roles: ["PORTEIRO"] },
      { title: "Status Caminhão", url: "/status-caminhao", icon: FileText, roles: ["PORTEIRO"] },
      { title: "TV Display", url: "/tv-display", icon: Monitor, roles: ["PORTEIRO"] },
    ];

    const clienteItems = [
      { title: "Dashboard", url: "/cliente", icon: LayoutDashboard, roles: ["CLIENTE"] },
      
      { title: "Chamadas", url: "/cliente-chamadas", icon: PhoneCall, roles: ["CLIENTE"] },
      { title: "Relatórios", url: "/relatorios", icon: FileText, roles: ["CLIENTE"] },
    ];

    const gestorItems = [
      { title: "Gestão", url: "/gestao", icon: Shield, roles: ["GESTOR", "ADMIN"] },
      { title: "Usuários", url: "/usuarios", icon: Users, roles: ["GESTOR", "ADMIN"] },
      { title: "Filiais", url: "/filiais", icon: Building2, roles: ["GESTOR", "ADMIN"] },
      { title: "Vagas Admin", url: "/vagas-admin", icon: MapPin, roles: ["GESTOR", "ADMIN"] },
      { title: "Auditoria", url: "/auditoria", icon: FileText, roles: ["GESTOR", "ADMIN"] },
    ];

    const allItems = [
  ...baseItems,
  ...sharedItems,
  ...porteiroItems,
  ...clienteItems,
  ...gestorItems,
];


    return allItems.filter(item => {
  if (role === "ADMIN" || role === "GESTOR") {
    return true; // 👈 vê tudo
  }

  return item.roles.includes(role);
});

  };

  const menuItems = getMenuItemsByRole();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary">
            <Truck className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-semibold">RETROPATIO</span>
            <span className="text-xs opacity-70">Controle de Pátio</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
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
        <div className="space-y-3">
          <div className="rounded-md p-3 bg-sidebar-accent">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{user.nome}</span>
              <RoleBadge role={role} />
            </div>
            <span className="text-xs opacity-70">{user.email}</span>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
