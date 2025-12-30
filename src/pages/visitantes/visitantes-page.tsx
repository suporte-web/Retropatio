import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Check } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Visitante } from "@/shared/schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VisitantesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { user, loading } = useAuth();

  const filialId = localStorage.getItem("selected_filial");

  // ⛔ Aguarda autenticação
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        Carregando perfil...
      </div>
    );
  }

  if (!user) return null;

  const role = user.role; // 🔥 AGORA VEM DO CONTEXTO (GESTOR | PORTEIRO)

  console.log("ROLE ATUAL:", role);

  const isGestor = role === "GESTOR";
  const isPorteiro = role === "PORTEIRO";

  const [activeTab, setActiveTab] = useState("aprovados");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    empresa: "",
    tipoVisita: "visitante",
    motivoVisita: "",
  });

  /* ============================
     QUERY - PAINEL
  ============================ */
  const { data: visitantes } = useQuery<Visitante[]>({
    queryKey: ["visitantes", filialId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/visitantes/painel/${filialId}`
      );
      return res.json();
    },
    enabled: !!filialId,
    refetchInterval: isGestor ? 5000 : isPorteiro ? 7000 : false,
  });

  /* ============================
     QUERY - HISTÓRICO
  ============================ */
  const { data: historico } = useQuery<Visitante[]>({
    queryKey: ["visitantes-historico", filialId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/visitantes/historico/${filialId}`
      );
      return res.json();
    },
    enabled: !!filialId,
  });

  /* ============================
     AUTO REDIRECT GESTOR
  ============================ */
  useEffect(() => {
    if (isGestor && visitantes) {
      const aguardando = visitantes.filter(
        (v) => v.status === "aguardando"
      );
      if (aguardando.length > 0) {
        setActiveTab("aguardando");
      }
    }
  }, [visitantes, isGestor]);

  /* ============================
     REFRESH
  ============================ */
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["visitantes", filialId] });
    queryClient.invalidateQueries({
      queryKey: ["visitantes-historico", filialId],
    });
  };

  /* ============================
     MUTATIONS
  ============================ */
  const createVisitanteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/visitantes", {
        ...data,
        filialId,
      });
      return res.json();
    },
    onSuccess: () => {
      refresh();
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
  });

  const aprovarVisitanteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/visitantes/${id}/aprovar`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Visitante aprovado" });
    },
  });

  const registrarEntradaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/visitantes/${id}/entrada`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Entrada registrada" });
    },
  });

  const registrarSaidaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/visitantes/${id}/saida`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Saída registrada" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVisitanteMutation.mutate(formData);
  };

  /* ============================
     FILTROS
  ============================ */
  const visitantesAguardando =
    visitantes?.filter((v) => v.status === "aguardando") ?? [];
  const visitantesAprovados =
    visitantes?.filter((v) => v.status === "aprovado") ?? [];
  const visitantesDentro =
    visitantes?.filter((v) => v.status === "dentro") ?? [];
  const visitantesHistorico = historico ?? [];

  /* ============================
     JSX
  ============================ */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Visitantes</h1>
          <p className="text-muted-foreground">
            Controle de visitantes
          </p>
        </div>

        {isGestor && visitantesAguardando.length > 0 && (
          <div className="p-4 rounded-lg border border-amber-300 bg-amber-100 text-amber-900">
            🔔 Existem{" "}
            <strong>{visitantesAguardando.length}</strong> visitantes aguardando aprovação
          </div>
        )}

        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Visitante
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {isGestor && (
            <TabsTrigger value="aguardando">Aguardando</TabsTrigger>
          )}
          <TabsTrigger value="aprovados">Aprovados</TabsTrigger>
          <TabsTrigger value="dentro">Dentro</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* AGUARDANDO */}
        {isGestor && (
          <TabsContent value="aguardando" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitantes aguardando</CardTitle>
              </CardHeader>
              <CardContent>
                {visitantesAguardando.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{v.nome}</p>
                      <StatusBadge status={v.status} type="visitante" />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => aprovarVisitanteMutation.mutate(v.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* APROVADOS */}
        <TabsContent value="aprovados" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              {visitantesAprovados.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{v.nome}</p>
                    <StatusBadge status={v.status} type="visitante" />
                  </div>
                  {isPorteiro && (
                    <Button
                      onClick={() => registrarEntradaMutation.mutate(v.id)}
                    >
                      Registrar Entrada
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DENTRO */}
        <TabsContent value="dentro" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dentro da filial</CardTitle>
            </CardHeader>
            <CardContent>
              {visitantesDentro.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <p className="font-medium">{v.nome}</p>
                  {isPorteiro && (
                    <Button
                      variant="outline"
                      onClick={() => registrarSaidaMutation.mutate(v.id)}
                    >
                      Registrar Saída
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              {visitantesHistorico.length > 0 ? (
                visitantesHistorico.map((v) => (
                  <div key={v.id} className="p-4 border rounded-lg">
                    <p className="font-medium">{v.nome}</p>
                    <p className="text-sm">
                      Entrada:{" "}
                      {v.dataEntrada
                        ? format(
                            new Date(v.dataEntrada),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )
                        : "-"}
                    </p>
                    <p className="text-sm">
                      Saída:{" "}
                      {v.dataSaida
                        ? format(
                            new Date(v.dataSaida),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )
                        : "-"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  Nenhum visitante no histórico
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Novo Visitante */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Visitante</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nome completo"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              required
            />

            <Input
              placeholder="CPF"
              value={formData.cpf}
              onChange={(e) =>
                setFormData({ ...formData, cpf: e.target.value })
              }
              required
            />

            <Input
              placeholder="Empresa"
              value={formData.empresa}
              onChange={(e) =>
                setFormData({ ...formData, empresa: e.target.value })
              }
            />

            <Textarea
              placeholder="Motivo da visita"
              value={formData.motivoVisita}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  motivoVisita: e.target.value,
                })
              }
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewDialog(false)}
              >
                Cancelar
              </Button>

              <Button type="submit">
                {createVisitanteMutation.isPending
                  ? "Salvando..."
                  : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
