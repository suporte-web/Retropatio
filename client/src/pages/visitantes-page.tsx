import { useEffect } from "react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Plus, Check, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Visitante } from "@/shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VisitantesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const filialId = localStorage.getItem("selected_filial");
  const role = localStorage.getItem("role"); // <-- 🔥 ajuste 1

  const [activeTab, setActiveTab] = useState("aprovados");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    empresa: "",
    tipoVisita: "visitante",
    motivoVisita: "",
  });

  // 🔥 Ajuste 2 - Query com rota correta
const { data: visitantes, isLoading } = useQuery<Visitante[]>({
  queryKey: ["visitantes", filialId],
  queryFn: async () => {
    const res = await apiRequest("GET", `/api/visitantes/filial/${filialId}`);
    return res.json();
  },
  enabled: !!filialId,
  refetchInterval: 2000, // 🔥 gestor atualiza toda hora
});

// Auto-redirecionar gestor para aba "aguardando" se houver visitantes esperando
useEffect(() => {
  if (role === "gestor" && visitantes) {
    const aguardando = visitantes.filter(v => v.status === "aguardando");
    if (aguardando.length > 0) {
      setActiveTab("aguardando");
    } 
  }
}, [visitantes, role]);

  // 🔥 Ajuste 3 - invalidate correto
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["visitantes", filialId] });

  const createVisitanteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/visitantes", {
        ...data,
        filialId,
      });
      return await res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Visitante cadastrado", description: "Aguardando aprovação" });
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
    mutationFn: async (visitanteId: string) => {
      const res = await apiRequest("PATCH", `/api/visitantes/${visitanteId}/aprovar`, {});
      return await res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Visitante aprovado" });
    },
  });

  const registrarEntradaMutation = useMutation({
    mutationFn: async (visitanteId: string) => {
      const res = await apiRequest("PATCH", `/api/visitantes/${visitanteId}/entrada`, {});
      return await res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Entrada registrada" });
    },
  });

  const registrarSaidaMutation = useMutation({
    mutationFn: async (visitanteId: string) => {
      const res = await apiRequest("PATCH", `/api/visitantes/${visitanteId}/saida`, {});
      return await res.json();
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

  const visitantesAguardando = visitantes?.filter((v) => v.status === "aguardando");
  const visitantesAprovados = visitantes?.filter((v) => v.status === "aprovado");
  const visitantesDentro = visitantes?.filter((v) => v.status === "dentro" || v.status === "entrada");

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Visitantes</h1>
          <p className="text-muted-foreground">Controle de visitantes</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Visitante
        </Button>
      </div>

      {/* Stats - 🔥 ajuste 7 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {role === "gestor" && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aguardando</CardDescription>
              <CardTitle className="text-3xl text-amber-600">
                {visitantesAguardando?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovados</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {visitantesAprovados?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dentro</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {visitantesDentro?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{visitantes?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {role === "gestor" && (
            <TabsTrigger value="aguardando">Aguardando</TabsTrigger>
          )}

          <TabsTrigger value="aprovados">Aprovados</TabsTrigger>
          <TabsTrigger value="dentro">Dentro</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* 🔥 Aba AGUARDANDO — só gestor */}
        {role === "gestor" && (
          <TabsContent value="aguardando" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitantes aguardando</CardTitle>
              </CardHeader>
              <CardContent>
                {visitantesAguardando?.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <span className="font-medium">{v.nome}</span>
                      <StatusBadge status={v.status} type="visitante" />
                      <p className="text-sm text-muted-foreground">CPF: {v.cpf}</p>
                    </div>

                    {/* 🔥 Botão só gestor */}
                    {role === "gestor" && (
                      <Button size="sm" onClick={() => aprovarVisitanteMutation.mutate(v.id)}>
                        <Check className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                    )}
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
              {visitantesAprovados?.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{v.nome}</p>
                    <StatusBadge status={v.status} type="visitante" />
                  </div>

                  {/* 🔥 Entrada só para porteiro */}
                  {role === "porteiro" && (
                    <Button onClick={() => registrarEntradaMutation.mutate(v.id)}>
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
              {visitantesDentro?.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{v.nome}</p>
                  </div>

                  {/* 🔥 Saída só porteiro */}
                  {role === "porteiro" && (
                    <Button variant="outline" onClick={() => registrarSaidaMutation.mutate(v.id)}>
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
              {visitantes?.map((v) => (
                <div key={v.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{v.nome}</p>
                  <StatusBadge status={v.status} type="visitante" />
                </div>
              ))}
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
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />

            <Input
              placeholder="CPF"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              required
            />

            <Input
              placeholder="Empresa"
              value={formData.empresa}
              onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
            />

            <Textarea
              placeholder="Motivo da visita"
              value={formData.motivoVisita}
              onChange={(e) => setFormData({ ...formData, motivoVisita: e.target.value })}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>

              <Button type="submit">
                {createVisitanteMutation.isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
