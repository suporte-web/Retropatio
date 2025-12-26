import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useLocation } from "wouter";
import FundoLogin from "@/assets/fundologin.jpeg";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { AuthService } from "@/stores/login/service";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Informe email e senha.");
      return;
    }

    try {
      setLoading(true);

      const res = await AuthService.login({ email, password });
      
      if (!res) {
        setErrorMsg(res?.error || "Falha no login.");
        return;
      }

      // 🔐 Centraliza autenticação no AuthContext
      await login(res);

      // 🧹 limpa filial anterior (importante!)
      localStorage.removeItem("selected_filial");

      if (res.message === "Login bem-sucedido") {
        navigate("/filial-selection");
      }

      // ❗ NÃO navega aqui
      // Quem decide a rota agora é:
      // - AppGate
      // - ProtectedLayout
    } catch (err) {
      console.error("Erro no login:", err);
      setErrorMsg("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${FundoLogin})`,
      }}
    >
      <div
        className="backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] w-full max-w-md"
        style={{
          backgroundColor: "rgba(255, 99, 25, 0.25)",
          border: "2px solid rgba(255, 99, 25, 0.5)",
        }}
      >
        <Card className="border-none bg-transparent shadow-none">
          <CardHeader className="text-center">
            <CardTitle
              className="text-3xl font-extrabold"
              style={{ color: "#ff6319" }}
            >
              Login
            </CardTitle>

            <CardDescription className="text-gray-900 font-semibold">
              Acesse o sistema RetroPátio
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="text-sm text-red-700 border border-red-400 rounded-md px-3 py-2 bg-red-50/80">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="voce@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/80 placeholder-gray-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">
                  Senha
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/80 placeholder-gray-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full text-white font-semibold shadow-md hover:opacity-90 transition
                bg-gradient-to-r from-orange-500 to-orange-600"
                disabled={loading}
              >
                {loading ? (
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
  );
}
