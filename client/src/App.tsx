import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import FilialSelectionPage from "@/pages/filial-selection-page";
import PortariaPage from "@/pages/portaria-page";
import VagasPage from "@/pages/vagas-page";
import VisitantesPage from "@/pages/visitantes-page";
import ChamadasPage from "@/pages/chamadas-page";
import ClienteDashboardPage from "@/pages/cliente-dashboard-page";
import RelatoriosPage from "@/pages/relatorios-page";
import GestaoPage from "@/pages/gestao-page";
import UsuariosPage from "@/pages/usuarios-page";
import FiliaisPage from "@/pages/filiais-page";
import AuditoriaPage from "@/pages/auditoria-page";
import MotoristasPage from "@/pages/motoristas-page";
import VeiculosCadastroPage from "@/pages/veiculos-cadastro-page";
import FornecedoresPage from "@/pages/fornecedores-page";
import StatusCaminhaoPage from "@/pages/status-caminhao-page";
import { Loader2 } from "lucide-react";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  // Initialize WebSocket connection for real-time updates
  useWebSocket();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 h-16 flex-shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
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

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/filial">
        {() => (
          <ProtectedLayout>
            <FilialSelectionPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/portaria">
        {() => (
          <ProtectedLayout>
            <PortariaPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/vagas">
        {() => (
          <ProtectedLayout>
            <VagasPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/visitantes">
        {() => (
          <ProtectedLayout>
            <VisitantesPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/chamadas">
        {() => (
          <ProtectedLayout>
            <ChamadasPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/cliente">
        {() => (
          <ProtectedLayout>
            <ClienteDashboardPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/relatorios">
        {() => (
          <ProtectedLayout>
            <RelatoriosPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/gestao">
        {() => (
          <ProtectedLayout>
            <GestaoPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/usuarios">
        {() => (
          <ProtectedLayout>
            <UsuariosPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/filiais">
        {() => (
          <ProtectedLayout>
            <FiliaisPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/auditoria">
        {() => (
          <ProtectedLayout>
            <AuditoriaPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/motoristas">
        {() => (
          <ProtectedLayout>
            <MotoristasPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/veiculos-cadastro">
        {() => (
          <ProtectedLayout>
            <VeiculosCadastroPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/fornecedores">
        {() => (
          <ProtectedLayout>
            <FornecedoresPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/status-caminhao">
        {() => (
          <ProtectedLayout>
            <StatusCaminhaoPage />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/">
        {() => <Redirect to="/filial" />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
