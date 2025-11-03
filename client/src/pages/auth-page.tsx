import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import logoImage from "@assets/1_1762177943558.png";

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
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center gap-3 mb-2">
                <img 
                  src={logoImage} 
                  alt="Pizzattolog" 
                  className="h-20 w-auto"
                  data-testid="img-logo"
                />
                <CardTitle className="text-2xl text-center">Acesse sua conta</CardTitle>
              </div>
              <CardDescription className="text-center">
                Entre com suas credenciais para acessar o sistema de controle de pátio e portaria
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
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12 relative overflow-hidden">
        {/* Gradient waves background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-orange-500/30 to-yellow-500/30"></div>
        
        <div className="max-w-md text-white space-y-10 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Controle Total do seu Pátio
            </h2>
            <p className="text-lg opacity-90">
              Gerencie entrada e saída de veículos, visitantes e operações logísticas com eficiência e segurança.
            </p>
          </div>
          
          <ul className="space-y-4 text-base">
            <li className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
              <span className="opacity-90">Controle em tempo real de vagas e movimentações</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
              <span className="opacity-90">Gestão completa de visitantes e prestadores</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
              <span className="opacity-90">Relatórios e auditoria detalhados</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
              <span className="opacity-90">Sistema multi-filial integrado</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
