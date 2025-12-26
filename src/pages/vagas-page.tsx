import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Vaga, Veiculo } from "@/shared/schema";
import { Badge } from "@/components/ui/badge";

export default function VagasPage() {
  const filialId = localStorage.getItem("selected_filial");
  const token = localStorage.getItem("token");

  // ===============================
  // BUSCAR VAGAS DA FILIAL CORRETO
  // ===============================
  const { data: vagas, isLoading } = useQuery<Vaga[]>({
    queryKey: ["vagas", filialId],
    enabled: !!filialId,
    queryFn: async () => {
      const res = await fetch(`/api/vagas/filial/${filialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar vagas");
      return res.json();
    },
  });

  // ===============================
  // BUSCAR VEÍCULOS
  // ===============================
  const { data: veiculos } = useQuery<Veiculo[]>({
    queryKey: ["veiculos", filialId],
    enabled: !!filialId,
    queryFn: async () => {
      const res = await fetch(`/api/veiculos?filialId=${filialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar veículos");
      return res.json();
    },
  });

  // ===============================
  // ACHAR VEÍCULO OCUPANDO A VAGA
  // ===============================
  const getVeiculoByVaga = (vagaId: number) => {
    return veiculos?.find(
      (v) => Number(v.vagaId) === Number(vagaId) && !v.dataSaida
    );
  };

  // ===============================
  // CÁLCULOS DE OCUPAÇÃO
  // ===============================
  const totalVagas = vagas?.length || 0;

  const vagasOcupadas =
  vagas?.filter((v) =>
    v.status === "ocupada" ||
    getVeiculoByVaga(v.id)
  ).length || 0;

  const vagasLivres = totalVagas - vagasOcupadas;

  const ocupacaoPercent =
    totalVagas > 0 ? Math.round((vagasOcupadas / totalVagas) * 100) : 0;

  // ===============================
  // LOADING
  // ===============================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ===============================
  // TELA
  // ===============================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mapa de Vagas</h1>
        <p className="text-muted-foreground">
          Visualização em tempo real das vagas do pátio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Vagas</CardDescription>
            <CardTitle className="text-3xl">{totalVagas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vagas Livres</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{vagasLivres}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vagas Ocupadas</CardDescription>
            <CardTitle className="text-3xl text-rose-600">{vagasOcupadas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Ocupação</CardDescription>
            <CardTitle className="text-3xl">{ocupacaoPercent}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Mapa de Vagas */}
      <Card>
        <CardHeader>
          <CardTitle>Vagas Disponíveis</CardTitle>
          <CardDescription>Clique em uma vaga para ver detalhes</CardDescription>
        </CardHeader>

        <CardContent>
          {vagas && vagas.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">

              {vagas.map((vaga) => {
                const veiculo = getVeiculoByVaga(vaga.id);
                const isOcupada =
                vaga.status === "ocupada" ||
                !!veiculo;

                return (
                  <div
                    key={vaga.id}
                    className={`relative aspect-square rounded-lg border-2 p-4 transition-all hover-elevate cursor-pointer ${
                      isOcupada
                        ? "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30"
                        : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    }`}
                    data-testid={`vaga-${vaga.NomeVaga}`}
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <div className="flex items-center gap-1">
                        <MapPin
                          className={`h-5 w-5 ${
                            isOcupada ? "text-rose-600" : "text-emerald-600"
                          }`}
                        />
                        <span className="text-2xl font-bold">
                          {vaga.NomeVaga}
                        </span>
                      </div>

                      <StatusBadge
                        status={isOcupada ? "ocupada" : "livre"}
                        type="vaga"
                      />

                      {veiculo && (
                        <div className="mt-2 text-center space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {veiculo.placaCavalo}
                          </Badge>
                          <p className="text-xs text-muted-foreground truncate max-w-full px-1">
                            {veiculo.motorista}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma vaga cadastrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-emerald-200 border-2 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-800"></div>
              <span className="text-sm text-muted-foreground">Vaga Livre</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-rose-200 border-2 border-rose-300 dark:bg-rose-950 dark:border-rose-800"></div>
              <span className="text-sm text-muted-foreground">Vaga Ocupada</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
