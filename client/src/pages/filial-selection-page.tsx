import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Building2, Search, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Filial } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function FilialSelectionPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilialId, setSelectedFilialId] = useState<string | null>(() => {
    return localStorage.getItem("selected_filial");
  });

  const { data: filiais, isLoading } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const { data: userFiliais } = useQuery<string[]>({
    queryKey: ["/api/user-filiais"],
  });

  const filteredFiliais = filiais?.filter((filial) => {
    const matchesSearch = filial.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filial.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const hasAccess = !userFiliais || userFiliais.includes(filial.id);
    return matchesSearch && hasAccess && filial.ativo;
  });

  const handleSelectFilial = (filialId: string) => {
    setSelectedFilialId(filialId);
    localStorage.setItem("selected_filial", filialId);
    
    // Redirect based on role
    if (user?.role === "porteiro") {
      setLocation("/portaria");
    } else if (user?.role === "cliente") {
      setLocation("/cliente");
    } else if (user?.role === "gestor") {
      setLocation("/gestao");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary mb-4">
              <Building2 className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Selecione a Filial</h1>
          <p className="text-muted-foreground">
            Escolha a filial que deseja acessar para continuar
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-filial"
            placeholder="Buscar filial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filiais Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiliais?.map((filial) => (
            <Card
              key={filial.id}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedFilialId === filial.id
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => handleSelectFilial(filial.id)}
              data-testid={`card-filial-${filial.codigo}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {filial.nome}
                      {selectedFilialId === filial.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {filial.codigo.toUpperCase()}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{filial.endereco}</span>
                </div>
                {selectedFilialId === filial.id && (
                  <Button className="w-full" size="sm" data-testid="button-continue">
                    Continuar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFiliais?.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhuma filial encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
