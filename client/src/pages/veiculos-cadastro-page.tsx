import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VeiculoCadastro } from "@/shared/schema";
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

export default function VeiculosCadastroPage() {
  const { toast } = useToast();
  
  
  const selectedFilial = localStorage.getItem("selected_filial");

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingVeiculo, setEditingVeiculo] = useState<VeiculoCadastro | null>(null);

  const [formData, setFormData] = useState({
    tipo: "cavalo_carreta" as "carro" | "moto" | "cavalo" | "cavalo_carreta",
    placa: "",
    statusCarga: undefined as "carregado" | "descarregado" | "pernoite" | "manutencao" | undefined,
    ativo: true,
});

  const { data: veiculos, isLoading } = useQuery<VeiculoCadastro[]>({
    queryKey: ["/api/veiculos-cadastro", selectedFilial],
    enabled: !!selectedFilial,
});

  const createVeiculoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/veiculos-cadastro", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/veiculos-cadastro", selectedFilial] });
      toast({
        title: "Veículo criado",
        description: "Novo veículo adicionado com sucesso",
    });
      setFormData({ tipo: "cavalo_carreta", placa: "", statusCarga: undefined, ativo: true });
      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar veículo",
        description: error.message,
        variant: "destructive",
    });
    },
});

  const updateVeiculoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VeiculoCadastro> }) => {
      const res = await apiRequest("PATCH", `/api/veiculos-cadastro/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/veiculos-cadastro", selectedFilial] });
      toast({
        title: "Veículo atualizado",
        description: "Dados do veículo atualizados com sucesso",
    });
      setShowEditDialog(false);
      setEditingVeiculo(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar veículo",
        description: error.message,
        variant: "destructive",
    });
    },
});

  const deleteVeiculoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/veiculos-cadastro/${id}`, undefined);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/veiculos-cadastro", selectedFilial] });
      toast({
        title: "Veículo removido",
        description: "Veículo removido com sucesso",
    });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover veículo",
        description: error.message,
        variant: "destructive",
    });
    },
});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVeiculoMutation.mutate(formData);
  };

  const handleEdit = (veiculo: VeiculoCadastro) => {
    setEditingVeiculo(veiculo);
    setShowEditDialog(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVeiculo) {
      updateVeiculoMutation.mutate({
        id: editingVeiculo.id,
        data: {
          tipo: editingVeiculo.tipo,
          placa: editingVeiculo.placa,
          statusCarga: editingVeiculo.statusCarga,
          ativo: editingVeiculo.ativo,
        },
    });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este veículo?")) {
      deleteVeiculoMutation.mutate(id);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "cavalo_carreta": return "Carreta";
      case "cavalo": return "Caminhão";
      case "carro": return "Carro";
      case "moto": return "Moto";
      default: return tipo;
    }
  };

  const getStatusCargaLabel = (status: string) => {
    switch (status) {
      case "carregado": return "Carregado";
      case "descarregado": return "Descarregado";
      case "pernoite": return "Pernoite";
      case "manutencao": return "Manutenção";
      default: return status;
    }
  };

  const filteredVeiculos = veiculos?.filter((v) =>
    v.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const veiculosAtivos = veiculos?.filter((v) => v.ativo).length || 0;
  const veiculosInativos = veiculos?.filter((v) => !v.ativo).length || 0;

  if (!selectedFilial) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma filial selecionada</CardTitle>
            <CardDescription>Selecione uma filial para gerenciar veículos</CardDescription>
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
          <h1 className="text-3xl font-bold text-foreground">Veículos Cadastrados</h1>
          <p className="text-muted-foreground">Gerencie os veículos cadastrados</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-novo-veiculo">
          <Plus className="mr-2 h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Veículos</CardDescription>
            <CardTitle className="text-3xl">{veiculos?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Veículos Ativos</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{veiculosAtivos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Veículos Inativos</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{veiculosInativos}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar veículos..."
            data-testid="input-search-veiculos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Veiculos List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
          <CardDescription>{filteredVeiculos?.length || 0} veículos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVeiculos && filteredVeiculos.length > 0 ? (
            <div className="space-y-2">
              {filteredVeiculos.map((veiculo) => (
                <div
                  key={veiculo.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`veiculo-${veiculo.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{veiculo.placa}</span>
                      <Badge variant="outline">
                        {getTipoLabel(veiculo.tipo)}
                      </Badge>
                      {veiculo.statusCarga && (
                        <Badge variant="outline">
                          {getStatusCargaLabel(veiculo.statusCarga)}
                        </Badge>
                      )}
                      {veiculo.ativo ? (
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
                      onClick={() => handleEdit(veiculo)}
                      data-testid={`button-edit-${veiculo.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(veiculo.id)}
                      disabled={deleteVeiculoMutation.isPending}
                      data-testid={`button-delete-${veiculo.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum veículo encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Novo Veículo */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Veículo</DialogTitle>
            <DialogDescription>Preencha os dados do novo veículo</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa *</Label>
              <Input
                id="placa"
                data-testid="input-placa"
                placeholder="ABC-1234"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
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
                  <SelectItem value="cavalo_carreta">Carreta</SelectItem>
                  <SelectItem value="cavalo">Caminhão</SelectItem>
                  <SelectItem value="carro">Carro</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusCarga">Status de Carga</Label>
              <Select
                value={formData.statusCarga || ""}
                onValueChange={(value) => setFormData({ ...formData, statusCarga: value as typeof formData.statusCarga })}
              >
                <SelectTrigger data-testid="select-status-carga">
                  <SelectValue placeholder="Selecione o status (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carregado">Carregado</SelectItem>
                  <SelectItem value="descarregado">Descarregado</SelectItem>
                  <SelectItem value="pernoite">Pernoite</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createVeiculoMutation.isPending} data-testid="button-submit-veiculo">
                {createVeiculoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Veículo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Veículo */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
            <DialogDescription>Atualize os dados do veículo</DialogDescription>
          </DialogHeader>
          {editingVeiculo && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-placa">Placa *</Label>
                <Input
                  id="edit-placa"
                  data-testid="input-edit-placa"
                  value={editingVeiculo.placa}
                  onChange={(e) => setEditingVeiculo({ ...editingVeiculo, placa: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo *</Label>
                <Select
                  value={editingVeiculo.tipo}
                  onValueChange={(value) => setEditingVeiculo({ ...editingVeiculo, tipo: value as typeof editingVeiculo.tipo })}
                >
                  <SelectTrigger data-testid="select-edit-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cavalo_carreta">Carreta</SelectItem>
                    <SelectItem value="cavalo">Caminhão</SelectItem>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-statusCarga">Status de Carga</Label>
                <Select
                  value={editingVeiculo.statusCarga || ""}
                  onValueChange={(value) => setEditingVeiculo({ ...editingVeiculo, statusCarga: value as typeof editingVeiculo.statusCarga })}
                >
                  <SelectTrigger data-testid="select-edit-status-carga">
                    <SelectValue placeholder="Selecione o status (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carregado">Carregado</SelectItem>
                    <SelectItem value="descarregado">Descarregado</SelectItem>
                    <SelectItem value="pernoite">Pernoite</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ativo">Status *</Label>
                <Select
                  value={editingVeiculo.ativo ? "true" : "false"}
                  onValueChange={(value) => setEditingVeiculo({ ...editingVeiculo, ativo: value === "true" })}
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
                <Button type="submit" disabled={updateVeiculoMutation.isPending} data-testid="button-submit-edit-veiculo">
                  {updateVeiculoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
