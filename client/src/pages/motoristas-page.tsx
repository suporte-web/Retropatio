import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Motorista } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
export default function MotoristasPage() {
  const { toast } = useToast();
  const selectedFilial = localStorage.getItem("selected_filial");

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMotorista, setEditingMotorista] = useState<Motorista | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    tipo: "terceiro" as "terceiro" | "agregado" | "frota",
    ativo: true,
  });

  const { data: motoristas, isLoading } = useQuery<Motorista[]>({
    queryKey: ["/api/motoristas", selectedFilial],
    enabled: !!selectedFilial,
  });

  const createMotoristaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/motoristas", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motoristas", selectedFilial] });
      toast({
        title: "Motorista criado",
        description: "Novo motorista adicionado com sucesso",
      });
      setFormData({ nome: "", cpf: "", tipo: "terceiro", ativo: true });
      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar motorista",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMotoristaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Motorista> }) => {
      const res = await apiRequest("PATCH", `/api/motoristas/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motoristas", selectedFilial] });
      toast({
        title: "Motorista atualizado",
        description: "Dados do motorista atualizados com sucesso",
      });
      setShowEditDialog(false);
      setEditingMotorista(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar motorista",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMotoristaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/motoristas/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motoristas", selectedFilial] });
      toast({
        title: "Motorista removido",
        description: "Motorista removido com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover motorista",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMotoristaMutation.mutate(formData);
  };

  const handleEdit = (motorista: Motorista) => {
    setEditingMotorista(motorista);
    setShowEditDialog(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMotorista) {
      updateMotoristaMutation.mutate({
        id: editingMotorista.id,
        data: {
          nome: editingMotorista.nome,
          cpf: editingMotorista.cpf,
          tipo: editingMotorista.tipo,
          ativo: editingMotorista.ativo,
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este motorista?")) {
      deleteMotoristaMutation.mutate(id);
    }
  };

  const filteredMotoristas = motoristas?.filter((m) =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const motoristasAtivos = motoristas?.filter((m) => m.ativo).length || 0;
  const motoristasInativos = motoristas?.filter((m) => !m.ativo).length || 0;

  if (!selectedFilial) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma filial selecionada</CardTitle>
            <CardDescription>Selecione uma filial para gerenciar motoristas</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Motoristas</h1>
          <p className="text-muted-foreground">Gerencie os motoristas cadastrados</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-novo-motorista">
          <Plus className="mr-2 h-4 w-4" />
          Novo Motorista
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Motoristas</CardDescription>
            <CardTitle className="text-3xl">{motoristas?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Motoristas Ativos</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{motoristasAtivos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Motoristas Inativos</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{motoristasInativos}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar motoristas..."
            data-testid="input-search-motoristas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Motoristas List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Motoristas</CardTitle>
          <CardDescription>{filteredMotoristas?.length || 0} motoristas encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMotoristas && filteredMotoristas.length > 0 ? (
            <div className="space-y-2">
              {filteredMotoristas.map((motorista) => (
                <div
                  key={motorista.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`motorista-${motorista.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{motorista.nome}</span>
                      <Badge variant="outline">
                        {motorista.tipo === "terceiro" ? "Terceiro" : motorista.tipo === "agregado" ? "Agregado" : "Frota"}
                      </Badge>
                      {motorista.ativo ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">CPF: {motorista.cpf}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(motorista)}
                      data-testid={`button-edit-${motorista.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(motorista.id)}
                      disabled={deleteMotoristaMutation.isPending}
                      data-testid={`button-delete-${motorista.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum motorista encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Novo Motorista */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Motorista</DialogTitle>
            <DialogDescription>Preencha os dados do novo motorista</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                data-testid="input-nome"
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
                data-testid="input-cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as typeof formData.tipo })}
              >
                <SelectTrigger data-testid="select-tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terceiro">Terceiro</SelectItem>
                  <SelectItem value="agregado">Agregado</SelectItem>
                  <SelectItem value="frota">Frota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMotoristaMutation.isPending} data-testid="button-submit-motorista">
                {createMotoristaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Motorista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Motorista */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Motorista</DialogTitle>
            <DialogDescription>Atualize os dados do motorista</DialogDescription>
          </DialogHeader>
          {editingMotorista && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome Completo *</Label>
                <Input
                  id="edit-nome"
                  data-testid="input-edit-nome"
                  value={editingMotorista.nome}
                  onChange={(e) => setEditingMotorista({ ...editingMotorista, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF *</Label>
                <Input
                  id="edit-cpf"
                  data-testid="input-edit-cpf"
                  value={editingMotorista.cpf}
                  onChange={(e) => setEditingMotorista({ ...editingMotorista, cpf: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo *</Label>
                <Select
                  value={editingMotorista.tipo}
                  onValueChange={(value) => setEditingMotorista({ ...editingMotorista, tipo: value as typeof editingMotorista.tipo })}
                >
                  <SelectTrigger data-testid="select-edit-tipo">
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
                <Label htmlFor="edit-ativo">Status *</Label>
                <Select
                  value={editingMotorista.ativo ? "true" : "false"}
                  onValueChange={(value) => setEditingMotorista({ ...editingMotorista, ativo: value === "true" })}
                >
                  <SelectTrigger data-testid="select-edit-ativo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMotoristaMutation.isPending} data-testid="button-submit-edit-motorista">
                  {updateMotoristaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
