import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { format, subDays, startOfDay, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Veiculo } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

  // Chart data: Movimentações últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = startOfDay(date).toISOString();
    const count = veiculos?.filter((v) => {
      const entryDate = startOfDay(new Date(v.dataEntrada));
      return entryDate.toISOString() === dateStr;
    }).length || 0;
    
    return {
      date: format(date, "dd/MM", { locale: ptBR }),
      fullDate: format(date, "dd MMM", { locale: ptBR }),
      movimentacoes: count,
    };
  });

  // Pie chart data: Distribuição por situação
  const COLORS = {
    aguardando: "#f59e0b",
    docado: "#3b82f6",
    carregando: "#8b5cf6",
    descarregando: "#06b6d4",
    finalizado: "#10b981",
  };

  const pieData = Object.entries(porSituacao || {}).map(([situacao, count]) => ({
    name: situacao.charAt(0).toUpperCase() + situacao.slice(1),
    value: count,
    color: COLORS[situacao as keyof typeof COLORS] || "#64748b",
  }));

  // Tempo médio de permanência (em horas)
  const veiculosComSaida = veiculos?.filter((v) => v.dataSaida);
  const tempoMedioPermanencia = veiculosComSaida && veiculosComSaida.length > 0
    ? veiculosComSaida.reduce((acc, v) => {
        const minutes = differenceInMinutes(new Date(v.dataSaida!), new Date(v.dataEntrada));
        return acc + (minutes / 60);
      }, 0) / veiculosComSaida.length
    : 0;

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
              Tempo Médio
            </CardDescription>
            <CardTitle className="text-3xl">{tempoMedioPermanencia.toFixed(1)}h</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Movimentações */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações - Últimos 7 Dias</CardTitle>
            <CardDescription>Entrada de veículos por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  labelFormatter={(label) => {
                    const item = last7Days.find((d) => d.date === label);
                    return item?.fullDate || label;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="movimentacoes"
                  fill="hsl(var(--primary))"
                  name="Entradas"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Distribuição */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Situação</CardTitle>
            <CardDescription>Status atual de todos os veículos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
