import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Loader2, Check, Plus } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Chamada, Veiculo } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function ChamadasPage() {
  const { toast } = useToast();
  const filialId = localStorage.getItem("selected_filial");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [formData, setFormData] = useState({
    veiculoId: "",
    motivo: "",
  });

  const { data: chamadas, isLoading } = useQuery<Chamada[]>({
    queryKey: ["/api/chamadas", filialId],
    enabled: !!filialId,
  });

  const { data: veiculos } = useQuery<Veiculo[]>({
    queryKey: ["/api/veiculos", filialId],
    enabled: !!filialId,
  });

  const createChamadaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/chamadas", {
        ...data,
        filialId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chamadas"] });
      toast({
        title: "Chamada criada",
        description: "Motorista será notificado",
      });
      setFormData({ veiculoId: "", motivo: "" });
      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar chamada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const atenderChamadaMutation = useMutation({
    mutationFn: async (chamadaId: string) => {
      const res = await apiRequest("PATCH", `/api/chamadas/${chamadaId}/atender`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chamadas"] });
      toast({
        title: "Chamada atendida",
        description: "Motorista foi notificado",
      });
    },
  });

  const getVeiculoById = (veiculoId: string) => {
    return veiculos?.find((v) => v.id === veiculoId);
  };

  const chamadasPendentes = chamadas?.filter((c) => c.status === "pendente");
  const chamadasAtendidas = chamadas?.filter((c) => c.status === "atendida");
  const veiculosAtivos = veiculos?.filter((v) => v.situacao !== "finalizado");

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chamadas de Motorista</h1>
          <p className="text-muted-foreground">Gerencie as notificações e chamadas dos motoristas</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-nova-chamada">
              <Plus className="mr-2 h-4 w-4" />
              Nova Chamada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Chamada</DialogTitle>
              <DialogDescription>
                Solicite um motorista para atendimento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="veiculo">Veículo *</Label>
                <Select
                  value={formData.veiculoId}
                  onValueChange={(value) => setFormData({ ...formData, veiculoId: value })}
                >
                  <SelectTrigger id="veiculo" data-testid="select-veiculo">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculosAtivos?.map((veiculo) => (
                      <SelectItem key={veiculo.id} value={veiculo.id}>
                        {veiculo.placaCavalo} - {veiculo.motorista}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Input
                  id="motivo"
                  data-testid="input-motivo"
                  placeholder="Ex: Movimentar veículo para doca 5"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewDialog(false);
                    setFormData({ veiculoId: "", motivo: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => createChamadaMutation.mutate(formData)}
                  disabled={!formData.veiculoId || !formData.motivo || createChamadaMutation.isPending}
                  data-testid="button-criar-chamada"
                >
                  {createChamadaMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Chamada"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chamadas Pendentes</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{chamadasPendentes?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Atendidas Hoje</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{chamadasAtendidas?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hoje</CardDescription>
            <CardTitle className="text-3xl">{chamadas?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Chamadas Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Chamadas Pendentes</CardTitle>
          <CardDescription>Atenda as chamadas dos motoristas</CardDescription>
        </CardHeader>
        <CardContent>
          {chamadasPendentes && chamadasPendentes.length > 0 ? (
            <div className="space-y-2">
              {chamadasPendentes.map((chamada) => {
                const veiculo = getVeiculoById(chamada.veiculoId);
                return (
                  <div
                    key={chamada.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate animate-pulse"
                    data-testid={`chamada-${chamada.id}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">{chamada.motivo}</span>
                        <StatusBadge status={chamada.status} type="chamada" />
                      </div>
                      {veiculo && (
                        <>
                          <div className="text-sm text-muted-foreground">
                            Veículo: {veiculo.placaCavalo} - {veiculo.motorista}
                          </div>
                        </>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Criada em: {format(new Date(chamada.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <Button
                      onClick={() => atenderChamadaMutation.mutate(chamada.id)}
                      disabled={atenderChamadaMutation.isPending}
                      data-testid={`button-atender-${chamada.id}`}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Atender
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma chamada pendente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Chamadas</CardTitle>
          <CardDescription>Chamadas atendidas e canceladas</CardDescription>
        </CardHeader>
        <CardContent>
          {chamadasAtendidas && chamadasAtendidas.length > 0 ? (
            <div className="space-y-2">
              {chamadasAtendidas.map((chamada) => {
                const veiculo = getVeiculoById(chamada.veiculoId);
                return (
                  <div key={chamada.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{chamada.motivo}</span>
                          <StatusBadge status={chamada.status} type="chamada" />
                        </div>
                        {veiculo && (
                          <div className="text-sm text-muted-foreground">
                            Veículo: {veiculo.placaCavalo} - {veiculo.motorista}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {chamada.dataAtendimento && (
                          <div>Atendida: {format(new Date(chamada.dataAtendimento), "dd/MM HH:mm", { locale: ptBR })}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma chamada atendida hoje</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
