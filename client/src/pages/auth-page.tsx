import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  useEffect(() => {
    if (user) {
      setLocation("/filial");
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
              <Truck className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">RETROPATIO</h1>
            <p className="text-sm text-muted-foreground">Sistema de Controle de Pátio e Portaria</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acesse sua conta</CardTitle>
              <CardDescription>
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Usuário</Label>
                  <Input
                    id="login-username"
                    data-testid="input-login-username"
                    type="text"
                    placeholder="seu.usuario"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    data-testid="input-login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground space-y-6">
          <Truck className="h-24 w-24 mx-auto opacity-90" />
          <h2 className="text-4xl font-bold">Controle Total do seu Pátio</h2>
          <p className="text-lg opacity-90">
            Gerencie entrada e saída de veículos, visitantes e operações logísticas com eficiência e segurança.
          </p>
          <ul className="text-left space-y-3 text-sm opacity-90">
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary-foreground"></div>
              Controle em tempo real de vagas e movimentações
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary-foreground"></div>
              Gestão completa de visitantes e prestadores
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary-foreground"></div>
              Relatórios e auditoria detalhados
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary-foreground"></div>
              Sistema multi-filial integrado
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
