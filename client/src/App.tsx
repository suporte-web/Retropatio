// Reference: blueprint:javascript_auth_all_persistance
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/lib/protected-route";
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

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/filial" component={FilialSelectionPage} />
      <ProtectedRoute path="/portaria" component={PortariaPage} />
      <ProtectedRoute path="/vagas" component={VagasPage} />
      <ProtectedRoute path="/visitantes" component={VisitantesPage} />
      <ProtectedRoute path="/chamadas" component={ChamadasPage} />
      <ProtectedRoute path="/cliente" component={ClienteDashboardPage} />
      <ProtectedRoute path="/relatorios" component={RelatoriosPage} />
      <ProtectedRoute path="/gestao" component={GestaoPage} />
      <ProtectedRoute path="/usuarios" component={UsuariosPage} />
      <ProtectedRoute path="/filiais" component={FiliaisPage} />
      <ProtectedRoute path="/auditoria" component={AuditoriaPage} />
      <Route path="/" component={() => <FilialSelectionPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Route path="/auth">
                {() => <AuthPage />}
              </Route>

              <Route path="/filial">
                {() => <FilialSelectionPage />}
              </Route>

              <Route path="/(portaria|vagas|visitantes|chamadas|cliente|relatorios|gestao|usuarios|filiais|auditoria|/)">
                {() => (
                  <SidebarProvider style={style as React.CSSProperties}>
                    <div className="flex h-screen w-full">
                      <AppSidebar />
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <header className="flex items-center justify-between gap-2 border-b border-border px-4 h-16 flex-shrink-0">
                          <SidebarTrigger data-testid="button-sidebar-toggle" />
                          <div className="flex items-center gap-2">
                            <ThemeToggle />
                          </div>
                        </header>
                        <main className="flex-1 overflow-auto">
                          <Router />
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                )}
              </Route>
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
