import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck, LogOut, Plus, Loader2, Clock, UserCheck, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

/* =====================================================
   TIPOS PARA A PORTARIA (AGORA BASEADO EM ENTRADA)
===================================================== */
type EntradaAtiva = {
  id: number;
  filialId: string;
  vagaId: number;

  placaCavalo: string;
  placaCarreta?: string | null;
  motorista: string;

  tipo: string;
  tipoVeiculoCategoria?: string | null;
  tipoProprietario?: string | null;
  statusCarga?: string | null;

  transportadora?: string | null;
  cliente?: string | null;
  doca?: string | null;
  valor?: number | null;
  cte?: string | null;
  nf?: string | null;
  lacre?: string | null;
  cpfMotorista?: string | null;
  observacoes?: string | null;
  multi?: boolean | null;

  status?: string | null;
  dataEntrada: string;
  dataSaida?: string | null;

  vaga?: any;
  filial?: any;
};

type Vaga = {
  id: number;
  NomeVaga: string;
  status: string;
  tipoVaga?: {
    Nome: string;
  };
};

type Visitante = {
  id: string;
  nome: string;
  status: string;
};

type OperationMode = "selection" | "veiculo";

export default function PortariaPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const filialId = localStorage.getItem("selected_filial");
  const filialNome = localStorage.getItem("filialNome");
  const filialCodigo = localStorage.getItem("filialCodigo");

  useEffect(() => {
    if (!filialId) {
      setLocation("/filial-selection");
    }
  }, []);

  const [operationMode, setOperationMode] = useState<OperationMode>("selection");
  const [activeTab, setActiveTab] = useState("entrada");

  const [saidaDialogOpen, setSaidaDialogOpen] = useState(false);
  const [entradaSaida, setEntradaSaida] = useState<EntradaAtiva | null>(null);
  const [saidaData, setSaidaData] = useState({ cte: "", nf: "", lacre: "" });
  const [loadingVeiculos, setLoadingVeiculos] = useState(false);

  const [formData, setFormData] = useState({
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
    cte: "",
    nf: "",
    lacre: "",
    observacoes: "",
  });

  const isVeiculoLeve =
    formData.tipoVeiculoCategoria === "carro" ||
    formData.tipoVeiculoCategoria === "moto";

  useEffect(() => {
    if (isVeiculoLeve) {
      setFormData((prev) => ({
        ...prev,
        placaCarreta: "",
        transportadora: "",
        cliente: "",
        doca: "",
        valor: "",
        cte: "",
        nf: "",
        lacre: "",
        statusCarga: "",
        multi: false,
      }));
    }
  }, [isVeiculoLeve]);

  /* =========================
     CONSULTA ENTRADAS (ATIVAS / HOJE)
     - agora vem do /api/entrada
  ========================= */
  const { data: ativosRaw } = useQuery({
    queryKey: ["entrada-ativos", filialId],
    enabled: !!filialId,
    queryFn: () =>
      apiRequest("GET", `/api/entrada/ativos?filialId=${filialId}`).then((res) => res.json()),
  });

  const entradasAtivas: EntradaAtiva[] = Array.isArray(ativosRaw)
    ? ativosRaw
    : ativosRaw?.data ?? [];

  const { data: historicoHojeRaw } = useQuery({
    queryKey: ["entrada-historico-hoje"],
    enabled: true,
    queryFn: () =>
      apiRequest("GET", `/api/entrada/historico`).then((res) => res.json()),
  });

  const entradasHoje: EntradaAtiva[] = Array.isArray(historicoHojeRaw)
    ? historicoHojeRaw
    : historicoHojeRaw?.data ?? [];

  /* =========================
     VAGAS (mantém seu endpoint atual)
     - você usa status livre/ocupada para KPI
  ========================= */
  const { data: vagasRaw } = useQuery({
    queryKey: ["vagas", filialId],
    enabled: !!filialId,
    queryFn: () =>
      apiRequest("GET", `/api/vagas/filial/${filialId}`).then((res) => res.json()),
  });

  const vagas: Vaga[] = Array.isArray(vagasRaw)
    ? vagasRaw
    : vagasRaw?.data ?? [];

  /* =========================
     VISITANTES (mantém)
  ========================= */
  const { data: visitantesRaw } = useQuery({
    queryKey: ["visitantes", filialId],
    enabled: !!filialId,
    queryFn: () =>
      apiRequest("GET", `/api/visitantes?filialId=${filialId}`).then((res) => res.json()),
  });

  const visitantes: Visitante[] = Array.isArray(visitantesRaw)
    ? visitantesRaw
    : visitantesRaw?.data ?? [];

  /* =========================
     MUTATION: REGISTRAR ENTRADA
     - agora POST /api/entrada
     - envia TODOS os campos do seu form
  ========================= */
  const createEntradaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!filialId) throw new Error("Filial não selecionada");

      // ✅ payload com todos os campos do seu model Entrada
      const payload: any = {
        filialId,
        vagaId: data.vagaId, // backend converte Number
        placaCavalo: data.placaCavalo,
        placaCarreta: data.placaCarreta || null,
        motorista: data.motorista,

        // ✅ ESTE É O CAMPO OBRIGATÓRIO QUE FALTAVA ANTES
        // você pode manter como categoria:
        tipo: data.tipoVeiculoCategoria,

        tipoVeiculoCategoria: data.tipoVeiculoCategoria,
        tipoProprietario: isVeiculoLeve ? "terceiro" : data.tipoProprietario,
        statusCarga: isVeiculoLeve ? null : (data.statusCarga || null),

        transportadora: isVeiculoLeve ? null : (data.transportadora || null),
        cliente: isVeiculoLeve ? null : (data.cliente || null),
        doca: isVeiculoLeve ? null : (data.doca || null),

        valor: isVeiculoLeve ? null : (data.valor ? Number(data.valor) : null),
        cte: isVeiculoLeve ? null : (data.cte || null),
        nf: isVeiculoLeve ? null : (data.nf || null),
        lacre: isVeiculoLeve ? null : (data.lacre || null),

        cpfMotorista: data.cpfMotorista || null,
        observacoes: data.observacoes || null,
        multi: data.multi ?? false,
      };

      // opcional: se você quiser registrar “tipoMotorista” em observações para leve
      if (isVeiculoLeve) {
        payload.observacoes = `Tipo: ${
          data.tipoMotorista === "visitante" ? "Visitante" : "Funcionário"
        }${data.observacoes ? ` - ${data.observacoes}` : ""}`;
      }

      const res = await apiRequest("POST", "/api/entrada", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrada-ativos", filialId] });
      queryClient.invalidateQueries({ queryKey: ["entrada-historico-hoje"] });
      queryClient.invalidateQueries({ queryKey: ["vagas", filialId] });

      toast({ title: "Entrada registrada", description: "Entrada registrada com sucesso" });

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
        cte: "",
        nf: "",
        lacre: "",
        observacoes: "",
      });
    },
  });

  /* =========================
     MUTATION: REGISTRAR SAÍDA
     - agora PATCH /api/entrada/:id/saida
  ========================= */
  const registrarSaidaMutation = useMutation({
    mutationFn: async ({ entradaId, data }: { entradaId: number; data: typeof saidaData }) => {
      const res = await apiRequest("PATCH", `/api/entrada/${entradaId}/saida`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrada-ativos", filialId] });
      queryClient.invalidateQueries({ queryKey: ["entrada-historico-hoje"] });
      queryClient.invalidateQueries({ queryKey: ["vagas", filialId] });

      toast({ title: "Saída registrada", description: "Veículo liberado com sucesso" });

      setSaidaDialogOpen(false);
      setEntradaSaida(null);
      setSaidaData({ cte: "", nf: "", lacre: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ garante vaga (no back é obrigatório)
    if (!formData.vagaId) {
      toast({ title: "Selecione uma vaga", variant: "destructive" });
      return;
    }

    createEntradaMutation.mutate(formData);
  };

  const handleAbrirSaida = (entrada: EntradaAtiva) => {
    setEntradaSaida(entrada);
    setSaidaData({
      cte: entrada.cte || "",
      nf: entrada.nf || "",
      lacre: entrada.lacre || "",
    });
    setSaidaDialogOpen(true);
  };

  const handleConfirmarSaida = () => {
    if (entradaSaida) {
      registrarSaidaMutation.mutate({ entradaId: entradaSaida.id, data: saidaData });
    }
  };

  const veiculosHoje = entradasHoje?.filter((v) => {
    const hoje = new Date();
    return new Date(v.dataEntrada).toDateString() === hoje.toDateString();
  });

  const veiculosAtivos = entradasAtivas;

  const vagasLivres = vagas?.filter((v) => (v.status || "").toLowerCase() === "livre").length ?? 0;
  const vagasOcupadas = vagas?.filter((v) => (v.status || "").toLowerCase() === "ocupada").length ?? 0;

  const visitantesAguardando = visitantes?.filter((v) => v.status === "aguardando").length ?? 0;
  const visitantesAprovados = visitantes?.filter((v) => v.status === "aprovado").length ?? 0;

  if (operationMode === "selection") {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Controle de Portaria</h1>
          <p className="text-muted-foreground">Selecione uma operação</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card
            className="cursor-pointer hover-elevate"
            onClick={() => setOperationMode("veiculo")}
          >
            <CardHeader className="text-center space-y-4 p-8">
              <div className="flex justify-center">
                <div className="h-24 w-24 flex items-center justify-center bg-primary/10 rounded-2xl">
                  <Truck className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Veículos</CardTitle>
              <CardDescription>Registrar entrada e saída</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{veiculosAtivos?.length ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">{veiculosHoje?.length ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate"
            onClick={() => setLocation("/visitantes")}
          >
            <CardHeader className="text-center space-y-4 p-8">
              <div className="flex justify-center">
                <div className="h-24 w-24 flex items-center justify-center bg-emerald-500/10 rounded-2xl">
                  <UserCheck className="h-12 w-12 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Visitantes</CardTitle>
              <CardDescription>Gerenciar acesso</CardDescription>
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

        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardDescription>Vagas Livres</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">{vagasLivres}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Vagas Ocupadas</CardDescription>
              <CardTitle className="text-3xl text-rose-600">{vagasOcupadas}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setOperationMode("selection")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Controle de Veículos</h1>
          <p className="text-muted-foreground">Gerencie entradas e saídas</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entrada">
            <Plus className="h-4 w-4 mr-2" /> Nova Entrada
          </TabsTrigger>
          <TabsTrigger value="saida">
            <LogOut className="h-4 w-4 mr-2" /> Saída
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="h-4 w-4 mr-2" /> Histórico Hoje
          </TabsTrigger>
        </TabsList>

        {/* FORMULÁRIO DE ENTRADA */}
        <TabsContent value="entrada" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Entrada</CardTitle>
              <CardDescription>Preencha os dados abaixo</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo veículo */}
                <div className="space-y-2">
                  <Label>Tipo de Veículo *</Label>
                  <Select
                    value={formData.tipoVeiculoCategoria}
                    onValueChange={(v) => setFormData({ ...formData, tipoVeiculoCategoria: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carro">Carro</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="cavalo">Cavalo</SelectItem>
                      <SelectItem value="cavalo_carreta">Cavalo + Carreta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data / hora */}
                <div>
                  <Label>Data Entrada</Label>
                  <Input readOnly value={format(new Date(), "dd/MM/yyyy HH:mm")} />
                </div>

                {/* Carro/Moto → Visitante/Funcionário */}
                {isVeiculoLeve && (
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.tipoMotorista}
                      onValueChange={(v) => setFormData({ ...formData, tipoMotorista: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitante">Visitante</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Placas + motorista */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Placa *</Label>
                    <Input
                      required
                      value={formData.placaCavalo}
                      onChange={(e) =>
                        setFormData({ ...formData, placaCavalo: e.target.value.toUpperCase() })
                      }
                    />
                  </div>

                  {formData.tipoVeiculoCategoria === "cavalo_carreta" && (
                    <div>
                      <Label>Placa Carreta</Label>
                      <Input
                        value={formData.placaCarreta}
                        onChange={(e) =>
                          setFormData({ ...formData, placaCarreta: e.target.value.toUpperCase() })
                        }
                      />
                    </div>
                  )}

                  <div>
                    <Label>Motorista *</Label>
                    <Input
                      required
                      value={formData.motorista}
                      onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>CPF {isVeiculoLeve ? "" : "*"}</Label>
                    <Input
                      required={!isVeiculoLeve}
                      value={formData.cpfMotorista}
                      onChange={(e) => setFormData({ ...formData, cpfMotorista: e.target.value })}
                    />
                  </div>
                </div>

                {/* Seleção de Vaga */}
                <div className="space-y-2">
                  <Label>Vaga *</Label>
                  <Select
                    value={formData.vagaId}
                    onValueChange={(v) => setFormData({ ...formData, vagaId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma vaga" />
                    </SelectTrigger>

                    <SelectContent>
                      {vagas?.length ? (
                        vagas
                          .filter(v => (v.status || "").toLowerCase() === "livre") // mostra só livres no select
                          .map((vaga) => (
                            <SelectItem key={vaga.id} value={String(vaga.id)}>
                              {vaga.NomeVaga} — {vaga.tipoVaga?.Nome}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem disabled value="0">
                          Nenhuma vaga encontrada
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos pesados */}
                {!isVeiculoLeve && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Proprietário *</Label>
                      <Select
                        value={formData.tipoProprietario}
                        onValueChange={(v) => setFormData({ ...formData, tipoProprietario: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="terceiro">Terceiro</SelectItem>
                          <SelectItem value="agregado">Agregado</SelectItem>
                          <SelectItem value="frota">Frota</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Status Carga</Label>
                      <Select
                        value={formData.statusCarga}
                        onValueChange={(v) => setFormData({ ...formData, statusCarga: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Não informado" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="carregado">Carregado</SelectItem>
                          <SelectItem value="descarregado">Descarregado</SelectItem>
                          <SelectItem value="pernoite">Pernoite</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Transportadora</Label>
                      <Input
                        value={formData.transportadora}
                        onChange={(e) => setFormData({ ...formData, transportadora: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Cliente</Label>
                      <Input
                        value={formData.cliente}
                        onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Doca</Label>
                      <Input
                        value={formData.doca}
                        onChange={(e) => setFormData({ ...formData, doca: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>CTE</Label>
                      <Input
                        value={formData.cte}
                        onChange={(e) => setFormData({ ...formData, cte: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>NF</Label>
                      <Input
                        value={formData.nf}
                        onChange={(e) => setFormData({ ...formData, nf: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Lacre</Label>
                      <Input
                        value={formData.lacre}
                        onChange={(e) => setFormData({ ...formData, lacre: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        checked={formData.multi}
                        onChange={(e) => setFormData({ ...formData, multi: e.target.checked })}
                      />
                      <Label>Multi</Label>
                    </div>
                  </div>
                )}

                {/* Observações */}
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
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
                        cte: "",
                        nf: "",
                        lacre: "",
                        observacoes: "",
                      })
                    }
                  >
                    Limpar
                  </Button>

                  <Button type="submit" disabled={createEntradaMutation.isPending}>
                    {createEntradaMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-4 w-4" /> Registrar Entrada
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAÍDA */}
        <TabsContent value="saida" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Veículos no Pátio</CardTitle>
              <CardDescription>Selecione um para registrar saída</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVeiculos ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : veiculosAtivos?.length ? (
                <div className="space-y-2">
                  {veiculosAtivos.map((entrada) => (
                    <div key={entrada.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{entrada.placaCavalo}</div>
                        <div className="text-sm text-muted-foreground">
                          Motorista: {entrada.motorista}
                        </div>

                        {/* você pode manter seus badges */}
                        <Badge variant="outline">{entrada.status ?? "ativo"}</Badge>
                      </div>

                      <Button onClick={() => handleAbrirSaida(entrada)}>
                        <LogOut className="mr-2 h-4 w-4" /> Registrar Saída
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto opacity-50" />
                  Nenhum veículo no pátio
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Hoje</CardTitle>
              <CardDescription>Histórico de entradas e saídas</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVeiculos ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : veiculosHoje?.length ? (
                <div className="space-y-3">
                  {veiculosHoje.map((entrada) => (
                    <div key={entrada.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{entrada.placaCavalo}</div>
                          <div className="text-sm text-muted-foreground">
                            Motorista: {entrada.motorista}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          Entrada: {format(new Date(entrada.dataEntrada), "HH:mm")}
                          {entrada.dataSaida && (
                            <div>Saída: {format(new Date(entrada.dataSaida), "HH:mm")}</div>
                          )}
                        </div>
                      </div>

                      <Badge variant="outline">{entrada.status ?? "ativo"}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto opacity-50" />
                  Nenhuma movimentação hoje
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG SAÍDA */}
      <Dialog open={saidaDialogOpen} onOpenChange={setSaidaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Saída</DialogTitle>
          </DialogHeader>

          {entradaSaida && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{entradaSaida.placaCavalo}</div>
                <div className="text-sm text-muted-foreground">
                  Motorista: {entradaSaida.motorista}
                </div>
              </div>

              <div>
                <Label>Data Saída</Label>
                <Input readOnly value={format(new Date(), "dd/MM/yyyy HH:mm")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>CTE</Label>
                  <Input value={saidaData.cte} onChange={(e) => setSaidaData({ ...saidaData, cte: e.target.value })} />
                </div>
                <div>
                  <Label>NF</Label>
                  <Input value={saidaData.nf} onChange={(e) => setSaidaData({ ...saidaData, nf: e.target.value })} />
                </div>
                <div>
                  <Label>Lacre</Label>
                  <Input value={saidaData.lacre} onChange={(e) => setSaidaData({ ...saidaData, lacre: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaidaDialogOpen(false)}>
              Cancelar
            </Button>

            <Button onClick={handleConfirmarSaida} disabled={registrarSaidaMutation.isPending}>
              {registrarSaidaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" /> Confirmar Saída
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
