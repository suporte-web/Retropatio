import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, LogOut, Plus, Loader2, Clock, UserCheck, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";
import type { Veiculo, Vaga, Visitante } from "@shared/schema";

type OperationMode = "selection" | "veiculo";

export default function PortariaPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const filialId = localStorage.getItem("selected_filial");
  const [operationMode, setOperationMode] = useState<OperationMode>("selection");
  const [activeTab, setActiveTab] = useState("entrada");

  const [formData, setFormData] = useState({
    tipoVeiculoCategoria: "cavalo_carreta" as "carro" | "moto" | "cavalo" | "cavalo_carreta",
    tipoProprietario: "terceiro" as "terceiro" | "agregado" | "frota",
    statusCarga: "" as "" | "carregado" | "descarregado" | "pernoite" | "manutencao",
    tipoMotorista: "visitante" as "visitante" | "funcionario", // For carro/moto
    placaCavalo: "",
    placaCarreta: "",
    motorista: "",
    cpfMotorista: "",
    transportadora: "",
    cliente: "",
    doca: "",
    vagaId: "",
    multi: false,
    valor: "",
    observacoes: "",
  });

  const isVeiculoLeve = formData.tipoVeiculoCategoria === "carro" || formData.tipoVeiculoCategoria === "moto";

  // Clear heavy-vehicle fields when switching to light vehicle
  useEffect(() => {
    if (isVeiculoLeve) {
      setFormData(prev => ({
        ...prev,
        placaCarreta: "",
        transportadora: "",
        cliente: "",
        doca: "",
        valor: "",
        statusCarga: "",
        multi: false,
      }));
    }
  }, [isVeiculoLeve]);

  const { data: veiculos, isLoading: loadingVeiculos } = useQuery<Veiculo[]>({
    queryKey: ["/api/veiculos", filialId],
    enabled: !!filialId,
  });

  const { data: vagas } = useQuery<Vaga[]>({
    queryKey: ["/api/vagas", filialId],
    enabled: !!filialId,
  });

  const { data: visitantes } = useQuery<Visitante[]>({
    queryKey: ["/api/visitantes", filialId],
    enabled: !!filialId,
  });

  const createVeiculoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        ...data,
        filialId,
        situacao: "aguardando",
      };
      
      // For carro/moto, set tipoProprietario based on tipoMotorista
      const isLeve = data.tipoVeiculoCategoria === "carro" || data.tipoVeiculoCategoria === "moto";
      if (isLeve) {
        // For light vehicles, clear ALL heavy-vehicle fields to prevent leakage
        delete payload.placaCarreta;
        delete payload.transportadora;
        delete payload.cliente;
        delete payload.doca;
        delete payload.multi;
        delete payload.statusCarga;
        delete payload.valor;
        // Use tipoMotorista to determine observacoes context
        payload.observacoes = `Tipo: ${data.tipoMotorista === "visitante" ? "Visitante" : "Funcionário"}${data.observacoes ? ` - ${data.observacoes}` : ""}`;
        // Set a default tipoProprietario for light vehicles
        payload.tipoProprietario = "terceiro";
      } else {
        // Convert valor to string (numeric) if present
        if (data.valor && data.valor !== "") {
          payload.valor = parseFloat(data.valor).toFixed(2);
        } else {
          delete payload.valor;
        }
        // Remove statusCarga if empty
        if (!data.statusCarga) {
          delete payload.statusCarga;
        }
      }
      
      // Remove vagaId if empty
      if (!data.vagaId || data.vagaId === "") {
        delete payload.vagaId;
      }
      
      // Clean up tipoMotorista as it's not in the schema
      delete payload.tipoMotorista;
      
      const res = await apiRequest("POST", "/api/veiculos", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/veiculos", filialId] });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas", filialId] });
      toast({
        title: "Veículo registrado",
        description: "Entrada registrada com sucesso",
      });
      setFormData({
        tipoVeiculoCategoria: "cavalo_carreta",
        tipoProprietario: "terceiro",
        statusCarga: "",
        tipoMotorista: "visitante",
        placaCavalo: "",
        placaCarreta: "",
        motorista: "",
        cpfMotorista: "",
        transportadora: "",
        cliente: "",
        doca: "",
        vagaId: "",
        multi: false,
        valor: "",
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
      queryClient.invalidateQueries({ queryKey: ["/api/veiculos", filialId] });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas", filialId] });
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

  const visitantesAguardando = visitantes?.filter((v) => v.status === "aguardando").length || 0;
  const visitantesAprovados = visitantes?.filter((v) => v.status === "aprovado").length || 0;

  // Selection Cards View
  if (operationMode === "selection") {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Controle de Portaria</h1>
          <p className="text-sm md:text-base text-muted-foreground">Selecione uma operação para começar</p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
          {/* Veículos Card */}
          <Card
            className="cursor-pointer transition-all hover-elevate active-elevate-2 border-2"
            onClick={() => setOperationMode("veiculo")}
            data-testid="card-select-veiculo"
          >
            <CardHeader className="text-center space-y-4 p-8">
              <div className="flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
                  <Truck className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl">Veículos</CardTitle>
                <CardDescription className="mt-2">
                  Registrar entrada e saída de veículos
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-foreground">{veiculosAtivos?.length || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold text-foreground">{veiculosHoje?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visitantes Card */}
          <Card
            className="cursor-pointer transition-all hover-elevate active-elevate-2 border-2"
            onClick={() => setLocation("/visitantes")}
            data-testid="card-select-visitante"
          >
            <CardHeader className="text-center space-y-4 p-8">
              <div className="flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <UserCheck className="h-12 w-12 text-emerald-600" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl">Visitantes</CardTitle>
                <CardDescription className="mt-2">
                  Gerenciar visitantes e prestadores
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Aguardando</p>
                  <p className="text-2xl font-bold text-amber-600">{visitantesAguardando}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Aprovados</p>
                  <p className="text-2xl font-bold text-emerald-600">{visitantesAprovados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto mt-8">
          <Card>
            <CardHeader className="p-4 md:pb-2">
              <CardDescription className="text-xs md:text-sm">Vagas Livres</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-emerald-600">{vagasLivres}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4 md:pb-2">
              <CardDescription className="text-xs md:text-sm">Vagas Ocupadas</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-rose-600">{vagasOcupadas}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Veículos View
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOperationMode("selection")}
          data-testid="button-back-to-selection"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Controle de Veículos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie entrada e saída de veículos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="p-4 md:pb-2">
            <CardDescription className="text-xs md:text-sm">Veículos Ativos</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{veiculosAtivos?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 md:pb-2">
            <CardDescription className="text-xs md:text-sm">Entradas Hoje</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{veiculosHoje?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 md:pb-2">
            <CardDescription className="text-xs md:text-sm">Vagas Livres</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-emerald-600">{vagasLivres}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 md:pb-2">
            <CardDescription className="text-xs md:text-sm">Vagas Ocupadas</CardDescription>
            <CardTitle className="text-2xl md:text-3xl text-rose-600">{vagasOcupadas}</CardTitle>
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo de Veículo */}
                <div className="space-y-2">
                  <Label htmlFor="tipoVeiculoCategoria">Tipo de Veículo *</Label>
                  <Select
                    value={formData.tipoVeiculoCategoria}
                    onValueChange={(value: any) => setFormData({ ...formData, tipoVeiculoCategoria: value })}
                  >
                    <SelectTrigger id="tipoVeiculoCategoria" data-testid="select-tipo-veiculo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carro">Carro</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="cavalo">Cavalo (sem carreta)</SelectItem>
                      <SelectItem value="cavalo_carreta">Cavalo + Carreta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* For Cavalo/Cavalo+Carreta - Show Proprietário and Status Carga */}
                {!isVeiculoLeve && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipoProprietario">Proprietário *</Label>
                      <Select
                        value={formData.tipoProprietario}
                        onValueChange={(value: any) => setFormData({ ...formData, tipoProprietario: value })}
                      >
                        <SelectTrigger id="tipoProprietario" data-testid="select-tipo-proprietario">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="terceiro">Terceiro</SelectItem>
                          <SelectItem value="agregado">Agregado</SelectItem>
                          <SelectItem value="frota">Frota</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="statusCarga">Status da Carga</Label>
                      <Select
                        value={formData.statusCarga || undefined}
                        onValueChange={(value: any) => setFormData({ ...formData, statusCarga: value || "" })}
                      >
                        <SelectTrigger id="statusCarga" data-testid="select-status-carga">
                          <SelectValue placeholder="Não informado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="carregado">Carregado</SelectItem>
                          <SelectItem value="descarregado">Descarregado</SelectItem>
                          <SelectItem value="pernoite">Pernoite</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* For Carro/Moto - Show Visitante/Funcionário */}
                {isVeiculoLeve && (
                  <div className="space-y-2">
                    <Label htmlFor="tipoMotorista">Tipo *</Label>
                    <Select
                      value={formData.tipoMotorista}
                      onValueChange={(value: any) => setFormData({ ...formData, tipoMotorista: value })}
                    >
                      <SelectTrigger id="tipoMotorista" data-testid="select-tipo-motorista">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitante">Visitante</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Dados do Veículo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placaCavalo">
                      Placa {formData.tipoVeiculoCategoria === "carro" ? "Carro" : formData.tipoVeiculoCategoria === "moto" ? "Moto" : "Cavalo"} *
                    </Label>
                    <Input
                      id="placaCavalo"
                      data-testid="input-placa-cavalo"
                      placeholder="ABC-1234"
                      value={formData.placaCavalo}
                      onChange={(e) => setFormData({ ...formData, placaCavalo: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  {formData.tipoVeiculoCategoria === "cavalo_carreta" && (
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
                  )}
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
                    <Label htmlFor="cpfMotorista">CPF Motorista {!isVeiculoLeve && "*"}</Label>
                    <Input
                      id="cpfMotorista"
                      data-testid="input-cpf-motorista"
                      placeholder="000.000.000-00"
                      value={formData.cpfMotorista}
                      onChange={(e) => setFormData({ ...formData, cpfMotorista: e.target.value })}
                      required={!isVeiculoLeve}
                    />
                  </div>
                  
                  {/* Only for Cavalo/Cavalo+Carreta */}
                  {!isVeiculoLeve && (
                    <>
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
                    </>
                  )}
                  
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
                  
                  {/* Only for Cavalo/Cavalo+Carreta */}
                  {!isVeiculoLeve && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor (R$)</Label>
                        <Input
                          id="valor"
                          data-testid="input-valor"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.valor}
                          onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            id="multi"
                            data-testid="checkbox-multi"
                            checked={formData.multi}
                            onChange={(e) => setFormData({ ...formData, multi: e.target.checked })}
                            className="h-4 w-4 rounded border-input"
                          />
                          <Label htmlFor="multi" className="cursor-pointer">Multi</Label>
                        </label>
                      </div>
                    </>
                  )}
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
                      tipoVeiculoCategoria: "cavalo_carreta",
                      tipoProprietario: "terceiro",
                      statusCarga: "",
                      tipoMotorista: "visitante",
                      placaCavalo: "",
                      placaCarreta: "",
                      motorista: "",
                      cpfMotorista: "",
                      transportadora: "",
                      cliente: "",
                      doca: "",
                      vagaId: "",
                      multi: false,
                      valor: "",
                      observacoes: "",
                    })}
                    data-testid="button-limpar"
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
                          <span className="font-medium" data-testid={`text-placa-${veiculo.placaCavalo}`}>{veiculo.placaCavalo}</span>
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
                            <span className="font-medium" data-testid={`text-placa-${veiculo.placaCavalo}`}>{veiculo.placaCavalo}</span>
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
