import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Veiculo } from "@shared/schema";

export default function ClienteDashboardPage() {
  const filialId = localStorage.getItem("selected_filial");

  const { data: veiculos, isLoading } = useQuery<Veiculo[]>({
    queryKey: ["/api/veiculos", filialId],
    enabled: !!filialId,
  });

  const veiculosAtivos = veiculos?.filter((v) => !v.dataSaida);
  const veiculosHoje = veiculos?.filter((v) => {
    const hoje = new Date();
    const entrada = new Date(v.dataEntrada);
    return entrada.toDateString() === hoje.toDateString();
  });
  const veiculosFinalizados = veiculos?.filter((v) => v.situacao === "finalizado");

  // Group by situacao
  const porSituacao = veiculos?.reduce((acc, v) => {
    acc[v.situacao] = (acc[v.situacao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das operações do pátio</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Veículos Ativos
            </CardDescription>
            <CardTitle className="text-3xl">{veiculosAtivos?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Movimentações Hoje
            </CardDescription>
            <CardTitle className="text-3xl">{veiculosHoje?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Finalizados
            </CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{veiculosFinalizados?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Registros
            </CardDescription>
            <CardTitle className="text-3xl">{veiculos?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
          <CardDescription>Situação atual dos veículos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(porSituacao || {}).map(([situacao, count]) => (
              <div key={situacao} className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <StatusBadge status={situacao} type="veiculo" />
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas movimentações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {veiculosHoje && veiculosHoje.length > 0 ? (
            <div className="space-y-2">
              {veiculosHoje.slice(0, 10).map((veiculo) => (
                <div
                  key={veiculo.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`veiculo-recente-${veiculo.placaCavalo}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{veiculo.placaCavalo}</span>
                      {veiculo.placaCarreta && (
                        <span className="text-sm text-muted-foreground">+ {veiculo.placaCarreta}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {veiculo.motorista}
                      {veiculo.transportadora && ` - ${veiculo.transportadora}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={veiculo.situacao} type="veiculo" />
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Entrada: {format(new Date(veiculo.dataEntrada), "HH:mm", { locale: ptBR })}</div>
                    {veiculo.dataSaida && (
                      <div>Saída: {format(new Date(veiculo.dataSaida), "HH:mm", { locale: ptBR })}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma movimentação hoje</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
