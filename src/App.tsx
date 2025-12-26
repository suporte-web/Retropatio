import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { AuthProvider } from "@/contexts/AuthContext";
import { FilialProvider } from "@/contexts/FilialContext";

import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { FilialSelector } from "@/components/filial-selector";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import { Toaster } from "@/components/ui/toaster";

import { Loader2 } from "lucide-react";

// =====================
// PÁGINAS
// =====================
import AuthPage from "@/pages/login/auth-page";
import FilialSelectionPage from "@/pages/filialSelection/filial-selection-page";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/not-found";

import PortariaPage from "@/pages/portaria/portaria-page";
import VagasPage from "@/pages/vagas-page";
import VagasAdminPage from "@/pages/vagas-admin-page";
import VisitantesPage from "@/pages/visitantes/visitantes-page";
import ChamadasPage from "@/pages/chamadas/chamadas-page";

import ClienteDashboardPage from "@/pages/cliente-dashboard-page";
import ClienteChamadasPage from "@/pages/cliente-chamadas-page";
import RelatoriosPage from "@/pages/relatorios-page";

import GestaoPage from "@/pages/gestao-page";
import UsuariosPage from "@/pages/usuarios-page";
import FiliaisPage from "@/pages/filiais-page";
import AuditoriaPage from "@/pages/auditoria-page";

import MotoristasPage from "@/pages/motoristas/motoristas-page";
import VeiculosCadastroPage from "@/pages/veiculos-cadastro-page";
import FornecedoresPage from "@/pages/fornecedores/fornecedores-page";
import StatusCaminhaoPage from "@/pages/statusCaminhao/status-caminhao-page";

import TVDisplayPage from "@/pages/tvDisplay/tv-display-page";

// =========================================================
//  PROTECTED LAYOUT (APENAS UI)
// =========================================================

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 border-b px-4 h-16">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <FilialSelector />
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// =========================================================
//  APP GATE (CONTROLA AUTH LOADING)
// =========================================================

function AppGate() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Router />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

// =========================================================
//  ROTAS
// =========================================================

function Router() {
  return (
    <Switch>
      {/* Públicas */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/filial-selection" component={FilialSelectionPage} />
      <Route path="/unauthorized" component={Unauthorized} />

      {/* Portaria */}
      <Route path="/portaria">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <PortariaPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/vagas">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN", "CLIENTE"]}>
            <ProtectedLayout>
              <VagasPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/visitantes">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <VisitantesPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/chamadas">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <ChamadasPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/fornecedores">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <FornecedoresPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/motoristas">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <MotoristasPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/veiculos-cadastro">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <VeiculosCadastroPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/status-caminhao">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <StatusCaminhaoPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/tv-display">
        {() => (
          <ProtectedRoute roles={["PORTEIRO", "GESTOR", "ADMIN"]}>
            <TVDisplayPage />
          </ProtectedRoute>
        )}
      </Route>

      {/* Cliente */}
      <Route path="/cliente">
        {() => (
          <ProtectedRoute roles={["CLIENTE", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <ClienteDashboardPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/cliente-chamadas">
        {() => (
          <ProtectedRoute roles={["CLIENTE", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <ClienteChamadasPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/relatorios">
        {() => (
          <ProtectedRoute roles={["CLIENTE", "GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <RelatoriosPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      {/* Gestão */}
      <Route path="/gestao">
        {() => (
          <ProtectedRoute roles={["GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <GestaoPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/usuarios">
        {() => (
          <ProtectedRoute roles={["GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <UsuariosPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/filiais">
        {() => (
          <ProtectedRoute roles={["GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <FiliaisPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/vagas-admin">
        {() => (
          <ProtectedRoute roles={["GESTOR", "ADMIN"]}>
            <ProtectedLayout>
              <VagasAdminPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/auditoria">
        {() => (
          <ProtectedRoute roles={["ADMIN"]}>
            <ProtectedLayout>
              <AuditoriaPage />
            </ProtectedLayout>
          </ProtectedRoute>
        )}
      </Route>

      {/* Default */}
      <Route path="/">
        <Redirect to="/auth" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// =========================================================
//  APP ROOT
// =========================================================

export default function App() {
  console.log("🟢 App montado corretamente");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <FilialProvider>
            <AppGate />
          </FilialProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
