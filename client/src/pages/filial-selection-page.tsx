import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Building2, Search, MapPin, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/contexts/AuthContext";
import { useFilial } from "@/contexts/FilialContext";

export default function FilialSelectionPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { filiaisPermitidas, setFilialId, loading } = useFilial();

  const [searchTerm, setSearchTerm] = useState("");

  // 🔹 Filtragem apenas visual
  const filteredFiliais = filiaisPermitidas.filter((f) =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.codigo ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔹 Auto seleção se houver só uma filial
  useEffect(() => {
    if (!loading && filiaisPermitidas.length === 1) {
      handleSelectFilial(filiaisPermitidas[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, filiaisPermitidas]);

  function handleSelectFilial(id: string) {
    setFilialId(id);

    switch (user?.role?.toLowerCase()) {
      case "porteiro":
        navigate("/portaria");
        break;
      case "cliente":
        navigate("/cliente");
        break;
      default:
        navigate("/gestao");
        break;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filiaisPermitidas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">
        Nenhuma filial encontrada para seu usuário.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary mb-4">
              <Building2 className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Selecione a Filial</h1>
          <p className="text-muted-foreground">Escolha a filial para continuar</p>
        </div>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar filial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiliais.map((filial) => (
            <Card
              key={filial.id}
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => handleSelectFilial(filial.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{filial.nome}</CardTitle>
                {filial.codigo && (
                  <CardDescription>
                    <Badge variant="secondary">{filial.codigo}</Badge>
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                {filial.endereco && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {filial.endereco}
                  </div>
                )}
                <Button className="mt-4 w-full">Selecionar</Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
