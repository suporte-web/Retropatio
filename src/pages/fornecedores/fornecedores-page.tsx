import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Fornecedor } from "@/shared/schema";
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

export default function FornecedoresPage() {
  const { toast } = useToast();

  const selectedFilial = localStorage.getItem("selected_filial");

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    ativo: true,
  });

  const { data: fornecedores, isLoading } = useQuery<Fornecedor[]>({
    queryKey: ["/api/fornecedores", selectedFilial],
    enabled: !!selectedFilial,
  });

  const createFornecedorMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/fornecedores", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fornecedores", selectedFilial] });
      toast({
        title: "Fornecedor criado",
        description: "Novo fornecedor adicionado com sucesso",
      });
      setFormData({ nome: "", cnpj: "", ativo: true });
      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFornecedorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Fornecedor> }) => {
      const res = await apiRequest("PATCH", `/api/fornecedores/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fornecedores", selectedFilial] });
      toast({
        title: "Fornecedor atualizado",
        description: "Dados do fornecedor atualizados com sucesso",
      });
      setShowEditDialog(false);
      setEditingFornecedor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFornecedorMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/fornecedores/${id}`, undefined);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fornecedores", selectedFilial] });
      toast({
        title: "Fornecedor removido",
        description: "Fornecedor removido com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFornecedorMutation.mutate(formData);
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setShowEditDialog(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFornecedor) {
      updateFornecedorMutation.mutate({
        id: editingFornecedor.id,
        data: {
          nome: editingFornecedor.nome,
          cnpj: editingFornecedor.cnpj,
          ativo: editingFornecedor.ativo,
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este fornecedor?")) {
      deleteFornecedorMutation.mutate(id);
    }
  };

  const filteredFornecedores = fornecedores?.filter(
    (f) =>
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cnpj.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fornecedoresAtivos = fornecedores?.filter((f) => f.ativo).length || 0;
  const fornecedoresInativos = fornecedores?.filter((f) => !f.ativo).length || 0;

  if (!selectedFilial) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma filial selecionada</CardTitle>
            <CardDescription>Selecione uma filial para gerenciar fornecedores</CardDescription>
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
          <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie os fornecedores cadastrados</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-novo-fornecedor">
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Fornecedores</CardDescription>
            <CardTitle className="text-3xl">{fornecedores?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fornecedores Ativos</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{fornecedoresAtivos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fornecedores Inativos</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{fornecedoresInativos}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar fornecedores..."
            data-testid="input-search-fornecedores"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Fornecedores List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>{filteredFornecedores?.length || 0} fornecedores encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFornecedores && filteredFornecedores.length > 0 ? (
            <div className="space-y-2">
              {filteredFornecedores.map((fornecedor) => (
                <div
                  key={fornecedor.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`fornecedor-${fornecedor.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{fornecedor.nome}</span>
                      {fornecedor.ativo ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">CNPJ: {fornecedor.cnpj}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(fornecedor)}
                      data-testid={`button-edit-${fornecedor.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(fornecedor.id)}
                      disabled={deleteFornecedorMutation.isPending}
                      data-testid={`button-delete-${fornecedor.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Novo Fornecedor */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Fornecedor</DialogTitle>
            <DialogDescription>Preencha os dados do novo fornecedor</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                data-testid="input-nome"
                placeholder="Empresa ABC Ltda"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                data-testid="input-cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createFornecedorMutation.isPending} data-testid="button-submit-fornecedor">
                {createFornecedorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Fornecedor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Fornecedor */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>Atualize os dados do fornecedor</DialogDescription>
          </DialogHeader>
          {editingFornecedor && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  data-testid="input-edit-nome"
                  value={editingFornecedor.nome}
                  onChange={(e) => setEditingFornecedor({ ...editingFornecedor, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cnpj">CNPJ *</Label>
                <Input
                  id="edit-cnpj"
                  data-testid="input-edit-cnpj"
                  value={editingFornecedor.cnpj}
                  onChange={(e) => setEditingFornecedor({ ...editingFornecedor, cnpj: e.target.value })}
                  required
                />
              </div>

              {/* STATUS */}
              <div className="space-y-2">
                <Label htmlFor="edit-ativo">Status *</Label>

                <Select
                  value={editingFornecedor.ativo ? "true" : "false"}
                  onValueChange={(value) =>
                    setEditingFornecedor({
                      ...editingFornecedor,
                      ativo: value === "true",
                    })
                  }
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
                <Button type="submit" disabled={updateFornecedorMutation.isPending} data-testid="button-submit-edit-fornecedor">
                  {updateFornecedorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
