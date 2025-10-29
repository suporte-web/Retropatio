import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FileText, Shield, Loader2, TrendingUp, Activity } from "lucide-react";
import type { User, Filial, AuditLog, Veiculo } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GestaoPage() {
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const { data: veiculos } = useQuery<Veiculo[]>({
    queryKey: ["/api/veiculos/all"],
  });

  const usuariosAtivos = users?.filter((u) => u.ativo).length || 0;
  const filiaisAtivas = filiais?.filter((f) => f.ativo).length || 0;
  const veiculosHoje = veiculos?.filter((v) => {
    const hoje = new Date();
    const entrada = new Date(v.dataEntrada);
    return entrada.toDateString() === hoje.toDateString();
  }).length || 0;

  const recentLogs = auditLogs?.slice(0, 10) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários Ativos
            </CardDescription>
            <CardTitle className="text-3xl">{usuariosAtivos}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total: {users?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Filiais Ativas
            </CardDescription>
            <CardTitle className="text-3xl">{filiaisAtivas}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total: {filiais?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Movimentações Hoje
            </CardDescription>
            <CardTitle className="text-3xl">{veiculosHoje}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Eventos de Auditoria
            </CardDescription>
            <CardTitle className="text-3xl">{auditLogs?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate cursor-pointer transition-all" onClick={() => window.location.href = "/usuarios"} data-testid="card-manage-users">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Usuários</CardTitle>
                <CardDescription>Gerencie usuários e permissões</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer transition-all" onClick={() => window.location.href = "/filiais"} data-testid="card-manage-filiais">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Filiais</CardTitle>
                <CardDescription>Gerencie filiais e vagas</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer transition-all" onClick={() => window.location.href = "/auditoria"} data-testid="card-audit">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Auditoria</CardTitle>
                <CardDescription>Visualize logs do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{log.acao}</span>
                      <Badge variant="outline" className="text-xs">{log.entidade}</Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma atividade registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
