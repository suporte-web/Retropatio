import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Loader2, MapPin, Edit } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Filial } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function FiliaisPage() {
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    endereco: "",
  });

  const [editFormData, setEditFormData] = useState({
    endereco: "",
  });

  const { data: filiais, isLoading } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const createFilialMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/filiais", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      toast({
        title: "Filial criada",
        description: "Nova filial adicionada com sucesso",
      });
      setFormData({
        nome: "",
        codigo: "",
        endereco: "",
      });
      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar filial",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFilialStatusMutation = useMutation({
    mutationFn: async ({ filialId, ativo }: { filialId: string; ativo: boolean }) => {
      const res = await apiRequest("PATCH", `/api/filiais/${filialId}`, { ativo });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      toast({
        title: "Status atualizado",
        description: "Status da filial alterado",
      });
    },
  });

  const updateFilialMutation = useMutation({
    mutationFn: async ({ filialId, endereco }: { filialId: string; endereco: string }) => {
      const res = await apiRequest("PATCH", `/api/filiais/${filialId}`, { endereco });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      toast({
        title: "Endereço atualizado",
        description: "Endereço da filial atualizado com sucesso",
      });
      setShowEditDialog(false);
      setEditingFilial(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar endereço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFilialMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFilial) {
      updateFilialMutation.mutate({
        filialId: editingFilial.id,
        endereco: editFormData.endereco,
      });
    }
  };

  const openEditDialog = (filial: Filial) => {
    setEditingFilial(filial);
    setEditFormData({ endereco: filial.endereco });
    setShowEditDialog(true);
  };

  const filiaisAtivas = filiais?.filter((f) => f.ativo).length || 0;
  const filiaisInativas = filiais?.filter((f) => !f.ativo).length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Filiais</h1>
          <p className="text-muted-foreground">Gerencie as filiais do sistema</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-nova-filial">
          <Plus className="mr-2 h-4 w-4" />
          Nova Filial
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Filiais</CardDescription>
            <CardTitle className="text-3xl">{filiais?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Filiais Ativas</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{filiaisAtivas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Filiais Inativas</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{filiaisInativas}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filiais List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Filiais</CardTitle>
          <CardDescription>Todas as filiais cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filiais && filiais.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filiais.map((filial) => (
                <Card
                  key={filial.id}
                  className="hover-elevate"
                  data-testid={`filial-${filial.codigo}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {filial.nome}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {filial.codigo.toUpperCase()}
                          </Badge>
                          {filial.ativo ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800 text-xs">
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 text-xs">
                              Inativa
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{filial.endereco}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(filial)}
                        data-testid={`button-editar-${filial.codigo}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => toggleFilialStatusMutation.mutate({ filialId: filial.id, ativo: !filial.ativo })}
                        disabled={toggleFilialStatusMutation.isPending}
                        data-testid={`button-toggle-${filial.codigo}`}
                      >
                        {filial.ativo ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma filial cadastrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Filial */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Filial</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova filial
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                data-testid="input-nome-filial"
                placeholder="Filial Guarulhos"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                data-testid="input-codigo-filial"
                placeholder="guarulhos"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toLowerCase() })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                data-testid="input-endereco-filial"
                placeholder="Rua Exemplo, 123 - Guarulhos/SP"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                required
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
                disabled={createFilialMutation.isPending}
                data-testid="button-criar-filial"
              >
                {createFilialMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Filial"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Endereço */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Endereço</DialogTitle>
            <DialogDescription>
              Atualize o endereço da filial {editingFilial?.nome}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-endereco">Endereço *</Label>
              <Input
                id="edit-endereco"
                data-testid="input-edit-endereco"
                placeholder="Rua Exemplo, 123 - Cidade/Estado"
                value={editFormData.endereco}
                onChange={(e) => setEditFormData({ endereco: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingFilial(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateFilialMutation.isPending}
                data-testid="button-salvar-endereco"
              >
                {updateFilialMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
