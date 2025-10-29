import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AuditLog } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuditoriaPage() {
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    acao: "",
    entidade: "",
  });

  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filteredLogs = auditLogs?.filter((log) => {
    if (filters.dataInicio && new Date(log.createdAt) < new Date(filters.dataInicio)) return false;
    if (filters.dataFim && new Date(log.createdAt) > new Date(filters.dataFim)) return false;
    if (filters.acao && !log.acao.toLowerCase().includes(filters.acao.toLowerCase())) return false;
    if (filters.entidade && log.entidade !== filters.entidade) return false;
    return true;
  });

  const entidades = Array.from(new Set(auditLogs?.map((log) => log.entidade) || []));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Auditoria</h1>
        <p className="text-muted-foreground">Visualize o histórico de ações no sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Eventos</CardDescription>
            <CardTitle className="text-3xl">{auditLogs?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Eventos Filtrados</CardDescription>
            <CardTitle className="text-3xl">{filteredLogs?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entidades Monitoradas</CardDescription>
            <CardTitle className="text-3xl">{entidades.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine sua busca</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                data-testid="input-data-inicio"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                data-testid="input-data-fim"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entidade">Entidade</Label>
              <Select
                value={filters.entidade}
                onValueChange={(value) => setFilters({ ...filters, entidade: value })}
              >
                <SelectTrigger id="entidade" data-testid="select-entidade">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {entidades.map((entidade) => (
                    <SelectItem key={entidade} value={entidade}>
                      {entidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acao">Ação</Label>
              <Input
                id="acao"
                placeholder="Filtrar por ação"
                data-testid="input-acao"
                value={filters.acao}
                onChange={(e) => setFilters({ ...filters, acao: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Eventos</CardTitle>
          <CardDescription>{filteredLogs?.length || 0} eventos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover-elevate"
                  data-testid={`audit-log-${log.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{log.acao}</span>
                        <Badge variant="outline" className="text-xs">{log.entidade}</Badge>
                      </div>
                      {log.ipAddress && (
                        <div className="text-xs text-muted-foreground">
                          IP: {log.ipAddress}
                        </div>
                      )}
                      {log.dadosAntes && log.dadosDepois && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                          <div className="text-muted-foreground">
                            Antes: {log.dadosAntes}
                          </div>
                          <div className="text-muted-foreground">
                            Depois: {log.dadosDepois}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: ptBR })}</div>
                      <div className="text-xs">{format(new Date(log.createdAt), "HH:mm:ss", { locale: ptBR })}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
