import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, LogOut, Plus, Loader2, Clock } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Veiculo, Vaga } from "@shared/schema";

export default function PortariaPage() {
  const { toast } = useToast();
  const filialId = localStorage.getItem("selected_filial");
  const [activeTab, setActiveTab] = useState("entrada");

  const [formData, setFormData] = useState({
    placaCavalo: "",
    placaCarreta: "",
    motorista: "",
    cpfMotorista: "",
    transportadora: "",
    cliente: "",
    doca: "",
    vagaId: "",
    observacoes: "",
  });

  const { data: veiculos, isLoading: loadingVeiculos } = useQuery<Veiculo[]>({
    queryKey: ["/api/veiculos", filialId],
    enabled: !!filialId,
  });

  const { data: vagas } = useQuery<Vaga[]>({
    queryKey: ["/api/vagas", filialId],
    enabled: !!filialId,
  });

  const createVeiculoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/veiculos", {
        ...data,
        filialId,
        situacao: "aguardando",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Veículo registrado",
        description: "Entrada registrada com sucesso",
      });
      setFormData({
        placaCavalo: "",
        placaCarreta: "",
        motorista: "",
        cpfMotorista: "",
        transportadora: "",
        cliente: "",
        doca: "",
        vagaId: "",
        observacoes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registrarSaidaMutation = useMutation({
    mutationFn: async (veiculoId: string) => {
      const res = await apiRequest("PATCH", `/api/veiculos/${veiculoId}/saida`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Saída registrada",
        description: "Veículo liberado com sucesso",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVeiculoMutation.mutate(formData);
  };

  const veiculosHoje = veiculos?.filter((v) => {
    const hoje = new Date();
    const entrada = new Date(v.dataEntrada);
    return entrada.toDateString() === hoje.toDateString();
  });

  const veiculosAtivos = veiculos?.filter((v) => !v.dataSaida);

  const vagasLivres = vagas?.filter((v) => v.status === "livre").length || 0;
  const vagasOcupadas = vagas?.filter((v) => v.status === "ocupada").length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Controle de Portaria</h1>
        <p className="text-muted-foreground">Gerencie entrada e saída de veículos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Veículos Ativos</CardDescription>
            <CardTitle className="text-3xl">{veiculosAtivos?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entradas Hoje</CardDescription>
            <CardTitle className="text-3xl">{veiculosHoje?.length || 0}</CardTitle>
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
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entrada" data-testid="tab-entrada">
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrada
          </TabsTrigger>
          <TabsTrigger value="saida" data-testid="tab-saida">
            <LogOut className="h-4 w-4 mr-2" />
            Saída
          </TabsTrigger>
          <TabsTrigger value="historico" data-testid="tab-historico">
            <Clock className="h-4 w-4 mr-2" />
            Histórico Hoje
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrada" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Entrada de Veículo</CardTitle>
              <CardDescription>Preencha os dados do veículo e motorista</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placaCavalo">Placa Cavalo *</Label>
                    <Input
                      id="placaCavalo"
                      data-testid="input-placa-cavalo"
                      placeholder="ABC-1234"
                      value={formData.placaCavalo}
                      onChange={(e) => setFormData({ ...formData, placaCavalo: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placaCarreta">Placa Carreta</Label>
                    <Input
                      id="placaCarreta"
                      data-testid="input-placa-carreta"
                      placeholder="DEF-5678"
                      value={formData.placaCarreta}
                      onChange={(e) => setFormData({ ...formData, placaCarreta: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motorista">Motorista *</Label>
                    <Input
                      id="motorista"
                      data-testid="input-motorista"
                      placeholder="Nome do motorista"
                      value={formData.motorista}
                      onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfMotorista">CPF Motorista</Label>
                    <Input
                      id="cpfMotorista"
                      data-testid="input-cpf-motorista"
                      placeholder="000.000.000-00"
                      value={formData.cpfMotorista}
                      onChange={(e) => setFormData({ ...formData, cpfMotorista: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transportadora">Transportadora</Label>
                    <Input
                      id="transportadora"
                      data-testid="input-transportadora"
                      placeholder="Nome da transportadora"
                      value={formData.transportadora}
                      onChange={(e) => setFormData({ ...formData, transportadora: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input
                      id="cliente"
                      data-testid="input-cliente"
                      placeholder="Nome do cliente"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doca">Doca</Label>
                    <Input
                      id="doca"
                      data-testid="input-doca"
                      placeholder="Número da doca"
                      value={formData.doca}
                      onChange={(e) => setFormData({ ...formData, doca: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vagaId">Vaga</Label>
                    <Select
                      value={formData.vagaId}
                      onValueChange={(value) => setFormData({ ...formData, vagaId: value })}
                    >
                      <SelectTrigger id="vagaId" data-testid="select-vaga">
                        <SelectValue placeholder="Selecione uma vaga" />
                      </SelectTrigger>
                      <SelectContent>
                        {vagas?.filter(v => v.status === "livre").map((vaga) => (
                          <SelectItem key={vaga.id} value={vaga.id}>
                            Vaga {vaga.numero}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    data-testid="textarea-observacoes"
                    placeholder="Informações adicionais..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({
                      placaCavalo: "",
                      placaCarreta: "",
                      motorista: "",
                      cpfMotorista: "",
                      transportadora: "",
                      cliente: "",
                      doca: "",
                      vagaId: "",
                      observacoes: "",
                    })}
                  >
                    Limpar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createVeiculoMutation.isPending}
                    data-testid="button-registrar-entrada"
                  >
                    {createVeiculoMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-4 w-4" />
                        Registrar Entrada
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saida" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Veículos no Pátio</CardTitle>
              <CardDescription>Selecione um veículo para registrar saída</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVeiculos ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : veiculosAtivos && veiculosAtivos.length > 0 ? (
                <div className="space-y-2">
                  {veiculosAtivos.map((veiculo) => (
                    <div
                      key={veiculo.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`veiculo-${veiculo.placaCavalo}`}
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
                          Motorista: {veiculo.motorista}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={veiculo.situacao} type="veiculo" />
                          <span className="text-xs text-muted-foreground">
                            Entrada: {format(new Date(veiculo.dataEntrada), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => registrarSaidaMutation.mutate(veiculo.id)}
                        disabled={registrarSaidaMutation.isPending}
                        data-testid={`button-saida-${veiculo.placaCavalo}`}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Registrar Saída
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum veículo no pátio</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações de Hoje</CardTitle>
              <CardDescription>Histórico de entradas e saídas do dia</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVeiculos ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : veiculosHoje && veiculosHoje.length > 0 ? (
                <div className="space-y-2">
                  {veiculosHoje.map((veiculo) => (
                    <div
                      key={veiculo.id}
                      className="p-4 border rounded-lg"
                      data-testid={`historico-${veiculo.placaCavalo}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{veiculo.placaCavalo}</span>
                            {veiculo.placaCarreta && (
                              <span className="text-sm text-muted-foreground">+ {veiculo.placaCarreta}</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Motorista: {veiculo.motorista}
                          </div>
                          {veiculo.transportadora && (
                            <div className="text-sm text-muted-foreground">
                              Transportadora: {veiculo.transportadora}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhuma movimentação hoje</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
