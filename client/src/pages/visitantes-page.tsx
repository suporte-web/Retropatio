import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Plus, Check, X, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Visitante } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VisitantesPage() {
  const { toast } = useToast();
  const filialId = localStorage.getItem("selected_filial");
  const [activeTab, setActiveTab] = useState("aguardando");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    empresa: "",
    tipoVisita: "visitante",
    motivoVisita: "",
  });

  const { data: visitantes, isLoading } = useQuery<Visitante[]>({
    queryKey: ["/api/visitantes", filialId],
    enabled: !!filialId,
  });

  const createVisitanteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/visitantes", {
        ...data,
        filialId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitantes"] });
      toast({
        title: "Visitante cadastrado",
        description: "Aguardando aprovação",
      });
      setFormData({
        nome: "",
        cpf: "",
        empresa: "",
        tipoVisita: "visitante",
        motivoVisita: "",
      });
      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const aprovarVisitanteMutation = useMutation({
    mutationFn: async (visitanteId: string) => {
      const res = await apiRequest("PATCH", `/api/visitantes/${visitanteId}/aprovar`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitantes"] });
      toast({
        title: "Visitante aprovado",
        description: "Entrada liberada",
      });
    },
  });

  const registrarEntradaMutation = useMutation({
    mutationFn: async (visitanteId: string) => {
      const res = await apiRequest("PATCH", `/api/visitantes/${visitanteId}/entrada`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitantes"] });
      toast({
        title: "Entrada registrada",
        description: "Visitante está dentro da filial",
      });
    },
  });

  const registrarSaidaMutation = useMutation({
    mutationFn: async (visitanteId: string) => {
      const res = await apiRequest("PATCH", `/api/visitantes/${visitanteId}/saida`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitantes"] });
      toast({
        title: "Saída registrada",
        description: "Visitante deixou a filial",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVisitanteMutation.mutate(formData);
  };

  const visitantesAguardando = visitantes?.filter((v) => v.status === "aguardando");
  const visitantesAprovados = visitantes?.filter((v) => v.status === "aprovado");
  const visitantesDentro = visitantes?.filter((v) => v.status === "dentro");
  const visitantesSairam = visitantes?.filter((v) => v.status === "saiu");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Visitantes</h1>
          <p className="text-muted-foreground">Controle de visitantes e prestadores de serviço</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-novo-visitante">
          <Plus className="mr-2 h-4 w-4" />
          Novo Visitante
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aguardando</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{visitantesAguardando?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovados</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{visitantesAprovados?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dentro</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{visitantesDentro?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoje</CardDescription>
            <CardTitle className="text-3xl">{visitantes?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="aguardando" data-testid="tab-aguardando">
            Aguardando ({visitantesAguardando?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="aprovados" data-testid="tab-aprovados">
            Aprovados ({visitantesAprovados?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="dentro" data-testid="tab-dentro">
            Dentro ({visitantesDentro?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="historico" data-testid="tab-historico">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aguardando" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Visitantes Aguardando Aprovação</CardTitle>
              <CardDescription>Aprove ou rejeite solicitações de visita</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : visitantesAguardando && visitantesAguardando.length > 0 ? (
                <div className="space-y-2">
                  {visitantesAguardando.map((visitante) => (
                    <div
                      key={visitante.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`visitante-${visitante.cpf}`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{visitante.nome}</span>
                          <StatusBadge status={visitante.status} type="visitante" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          CPF: {visitante.cpf}
                        </div>
                        {visitante.empresa && (
                          <div className="text-sm text-muted-foreground">
                            Empresa: {visitante.empresa}
                          </div>
                        )}
                        {visitante.motivoVisita && (
                          <div className="text-sm text-muted-foreground">
                            Motivo: {visitante.motivoVisita}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => aprovarVisitanteMutation.mutate(visitante.id)}
                          disabled={aprovarVisitanteMutation.isPending}
                          data-testid={`button-aprovar-${visitante.cpf}`}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum visitante aguardando aprovação</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aprovados" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Visitantes Aprovados</CardTitle>
              <CardDescription>Registre a entrada de visitantes aprovados</CardDescription>
            </CardHeader>
            <CardContent>
              {visitantesAprovados && visitantesAprovados.length > 0 ? (
                <div className="space-y-2">
                  {visitantesAprovados.map((visitante) => (
                    <div
                      key={visitante.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{visitante.nome}</span>
                          <StatusBadge status={visitante.status} type="visitante" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          CPF: {visitante.cpf}
                        </div>
                        {visitante.empresa && (
                          <div className="text-sm text-muted-foreground">
                            Empresa: {visitante.empresa}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => registrarEntradaMutation.mutate(visitante.id)}
                        disabled={registrarEntradaMutation.isPending}
                        data-testid={`button-entrada-${visitante.cpf}`}
                      >
                        Registrar Entrada
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum visitante aprovado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dentro" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Visitantes Dentro da Filial</CardTitle>
              <CardDescription>Registre a saída de visitantes</CardDescription>
            </CardHeader>
            <CardContent>
              {visitantesDentro && visitantesDentro.length > 0 ? (
                <div className="space-y-2">
                  {visitantesDentro.map((visitante) => (
                    <div
                      key={visitante.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{visitante.nome}</span>
                          <StatusBadge status={visitante.status} type="visitante" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Entrada: {visitante.dataEntrada && format(new Date(visitante.dataEntrada), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => registrarSaidaMutation.mutate(visitante.id)}
                        disabled={registrarSaidaMutation.isPending}
                        data-testid={`button-saida-${visitante.cpf}`}
                      >
                        Registrar Saída
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum visitante dentro da filial</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Visitantes</CardTitle>
              <CardDescription>Todos os visitantes registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {visitantes && visitantes.length > 0 ? (
                <div className="space-y-2">
                  {visitantes.map((visitante) => (
                    <div key={visitante.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{visitante.nome}</span>
                            <StatusBadge status={visitante.status} type="visitante" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            CPF: {visitante.cpf}
                          </div>
                          {visitante.empresa && (
                            <div className="text-sm text-muted-foreground">
                              Empresa: {visitante.empresa}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {visitante.dataEntrada && (
                            <div>Entrada: {format(new Date(visitante.dataEntrada), "dd/MM HH:mm", { locale: ptBR })}</div>
                          )}
                          {visitante.dataSaida && (
                            <div>Saída: {format(new Date(visitante.dataSaida), "dd/MM HH:mm", { locale: ptBR })}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum visitante registrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Novo Visitante */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Visitante</DialogTitle>
            <DialogDescription>
              Preencha os dados do visitante para solicitar aprovação
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                data-testid="input-nome-visitante"
                placeholder="João Silva"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                data-testid="input-cpf-visitante"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                data-testid="input-empresa-visitante"
                placeholder="Nome da empresa"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoVisita">Tipo de Visita *</Label>
              <Select
                value={formData.tipoVisita}
                onValueChange={(value) => setFormData({ ...formData, tipoVisita: value })}
              >
                <SelectTrigger id="tipoVisita" data-testid="select-tipo-visita">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitante">Visitante</SelectItem>
                  <SelectItem value="prestador_servico">Prestador de Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivoVisita">Motivo da Visita</Label>
              <Textarea
                id="motivoVisita"
                data-testid="textarea-motivo-visita"
                placeholder="Descreva o motivo da visita..."
                value={formData.motivoVisita}
                onChange={(e) => setFormData({ ...formData, motivoVisita: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createVisitanteMutation.isPending}
                data-testid="button-cadastrar-visitante"
              >
                {createVisitanteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
