import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StatusCaminhao } from "@shared/schema";
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

export default function StatusCaminhaoPage() {
  const { toast } = useToast();
  
  
  const selectedFilial = localStorage.getItem("selected_filial");

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStatus, setEditingStatus] = useState<StatusCaminhao | null>(null);

  const [formData, setFormData] = useState({
    descricao: "",
    cor: "#3B82F6",
    ordem: 0,
    ativo: true,
});

  const { data: statusList, isLoading } = useQuery<StatusCaminhao[]>({
    queryKey: ["/api/status-caminhao", selectedFilial],
    enabled: !!selectedFilial,
});

  const createStatusMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/status-caminhao", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status-caminhao", selectedFilial] });
      toast({
        title: "Status criado",
        description: "Novo status adicionado com sucesso",
    });
      setFormData({ descricao: "", cor: "#3B82F6", ordem: 0, ativo: true });
      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar status",
        description: error.message,
        variant: "destructive",
    });
    },
});

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StatusCaminhao> }) => {
      const res = await apiRequest("PATCH", `/api/status-caminhao/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status-caminhao", selectedFilial] });
      toast({
        title: "Status atualizado",
        description: "Dados do status atualizados com sucesso",
    });
      setShowEditDialog(false);
      setEditingStatus(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
    });
    },
});

  const deleteStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/status-caminhao/${id}`, undefined);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status-caminhao", selectedFilial] });
      toast({
        title: "Status removido",
        description: "Status removido com sucesso",
    });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover status",
        description: error.message,
        variant: "destructive",
    });
    },
});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStatusMutation.mutate(formData);
  };

  const handleEdit = (status: StatusCaminhao) => {
    setEditingStatus(status);
    setShowEditDialog(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStatus) {
      updateStatusMutation.mutate({
        id: editingStatus.id,
        data: {
          descricao: editingStatus.descricao,
          cor: editingStatus.cor,
          ordem: editingStatus.ordem,
          ativo: editingStatus.ativo,
        },
    });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este status?")) {
      deleteStatusMutation.mutate(id);
    }
  };

  const filteredStatus = statusList?.filter((s) =>
    s.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStatus = filteredStatus?.sort((a, b) => a.ordem - b.ordem);

  const statusAtivos = statusList?.filter((s) => s.ativo).length || 0;
  const statusInativos = statusList?.filter((s) => !s.ativo).length || 0;

  if (!selectedFilial) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma filial selecionada</CardTitle>
            <CardDescription>Selecione uma filial para gerenciar status de caminhão</CardDescription>
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
          <h1 className="text-3xl font-bold text-foreground">Status de Caminhão</h1>
          <p className="text-muted-foreground">Gerencie os status de caminhão</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-novo-status">
          <Plus className="mr-2 h-4 w-4" />
          Novo Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Status</CardDescription>
            <CardTitle className="text-3xl">{statusList?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status Ativos</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{statusAtivos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status Inativos</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{statusInativos}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar status..."
            data-testid="input-search-status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Status</CardTitle>
          <CardDescription>{sortedStatus?.length || 0} status encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sortedStatus && sortedStatus.length > 0 ? (
            <div className="space-y-2">
              {sortedStatus.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`status-${status.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{status.descricao}</span>
                      <Badge 
                        variant="outline" 
                        style={{ 
                          backgroundColor: status.cor + '20', 
                          borderColor: status.cor, 
                          color: status.cor 
                        }}
                      >
                        Cor
                      </Badge>
                      <Badge variant="outline">
                        Ordem: {status.ordem}
                      </Badge>
                      {status.ativo ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(status)}
                      data-testid={`button-edit-${status.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(status.id)}
                      disabled={deleteStatusMutation.isPending}
                      data-testid={`button-delete-${status.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum status encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Novo Status */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Status</DialogTitle>
            <DialogDescription>Preencha os dados do novo status</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                data-testid="input-descricao"
                placeholder="Em trânsito"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cor">Cor *</Label>
              <div className="flex gap-2">
                <Input
                  id="cor"
                  type="color"
                  data-testid="input-cor"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-20"
                  required
                />
                <Input
                  type="text"
                  placeholder="#3B82F6"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem *</Label>
              <Input
                id="ordem"
                type="number"
                data-testid="input-ordem"
                placeholder="0"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createStatusMutation.isPending} data-testid="button-submit-status">
                {createStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Status */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Status</DialogTitle>
            <DialogDescription>Atualize os dados do status</DialogDescription>
          </DialogHeader>
          {editingStatus && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição *</Label>
                <Input
                  id="edit-descricao"
                  data-testid="input-edit-descricao"
                  value={editingStatus.descricao}
                  onChange={(e) => setEditingStatus({ ...editingStatus, descricao: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cor">Cor *</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-cor"
                    type="color"
                    data-testid="input-edit-cor"
                    value={editingStatus.cor}
                    onChange={(e) => setEditingStatus({ ...editingStatus, cor: e.target.value })}
                    className="w-20"
                    required
                  />
                  <Input
                    type="text"
                    value={editingStatus.cor}
                    onChange={(e) => setEditingStatus({ ...editingStatus, cor: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ordem">Ordem *</Label>
                <Input
                  id="edit-ordem"
                  type="number"
                  data-testid="input-edit-ordem"
                  value={editingStatus.ordem}
                  onChange={(e) => setEditingStatus({ ...editingStatus, ordem: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ativo">Status *</Label>
                <Select
                  value={editingStatus.ativo ? "true" : "false"}
                  onValueChange={(value) => setEditingStatus({ ...editingStatus, ativo: value === "true" })}
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
                <Button type="submit" disabled={updateStatusMutation.isPending} data-testid="button-submit-edit-status">
                  {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
