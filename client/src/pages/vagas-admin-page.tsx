import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ParkingSquare, Plus, Loader2, Edit, Trash2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vaga, Filial } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function VagasAdminPage() {
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null);
  const [deletingVaga, setDeletingVaga] = useState<Vaga | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilialFilter, setSelectedFilialFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    filialId: "",
    numero: "",
    descricao: "",
  });

  const [editFormData, setEditFormData] = useState({
    numero: "",
    descricao: "",
  });

  const { data: vagas, isLoading } = useQuery<Vaga[]>({
    queryKey: ["/api/vagas/all"],
  });

  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const createVagaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/vagas", data, {
        "X-Filial": data.filialId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Vaga criada",
        description: "Nova vaga adicionada com sucesso",
      });
      setFormData({
        filialId: "",
        numero: "",
        descricao: "",
      });
      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar vaga",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateVagaMutation = useMutation({
    mutationFn: async ({ vagaId, filialId, ...data }: { vagaId: string; filialId: string; numero: string; descricao: string }) => {
      const res = await apiRequest("PATCH", `/api/vagas/${vagaId}`, data, {
        "X-Filial": filialId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Vaga atualizada",
        description: "Vaga atualizada com sucesso",
      });
      setShowEditDialog(false);
      setEditingVaga(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar vaga",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteVagaMutation = useMutation({
    mutationFn: async ({ vagaId, filialId }: { vagaId: string; filialId: string }) => {
      await apiRequest("DELETE", `/api/vagas/${vagaId}`, undefined, {
        "X-Filial": filialId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Vaga deletada",
        description: "Vaga removida com sucesso",
      });
      setShowDeleteDialog(false);
      setDeletingVaga(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar vaga",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVagaMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVaga) {
      updateVagaMutation.mutate({
        vagaId: editingVaga.id,
        filialId: editingVaga.filialId,
        numero: editFormData.numero,
        descricao: editFormData.descricao,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingVaga) {
      deleteVagaMutation.mutate({
        vagaId: deletingVaga.id,
        filialId: deletingVaga.filialId,
      });
    }
  };

  const openEditDialog = (vaga: Vaga) => {
    setEditingVaga(vaga);
    setEditFormData({
      numero: vaga.numero,
      descricao: vaga.descricao || "",
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (vaga: Vaga) => {
    setDeletingVaga(vaga);
    setShowDeleteDialog(true);
  };

  const filteredVagas = vagas?.filter((vaga) => {
    const matchesSearch = vaga.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vaga.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilial = selectedFilialFilter === "all" || vaga.filialId === selectedFilialFilter;
    return matchesSearch && matchesFilial;
  });

  const getFilialNome = (filialId: string) => {
    return filiais?.find((f) => f.id === filialId)?.nome || "Desconhecida";
  };

  const vagasPorFilial = filiais?.map((filial) => ({
    filial,
    count: vagas?.filter((v) => v.filialId === filial.id).length || 0,
    livres: vagas?.filter((v) => v.filialId === filial.id && v.status === "livre").length || 0,
    ocupadas: vagas?.filter((v) => v.filialId === filial.id && v.status === "ocupada").length || 0,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Vagas</h1>
          <p className="text-muted-foreground">Gerencie as vagas de estacionamento de todas as filiais</p>
        </div>
        <Button
          onClick={() => setShowNewDialog(true)}
          data-testid="button-nova-vaga"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Vaga
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Vagas</CardDescription>
            <CardTitle className="text-3xl">{vagas?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vagas Livres</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {vagas?.filter((v) => v.status === "livre").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vagas Ocupadas</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {vagas?.filter((v) => v.status === "ocupada").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Filiais com Vagas</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(vagas?.map((v) => v.filialId)).size || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Vagas por Filial */}
      <Card>
        <CardHeader>
          <CardTitle>Vagas por Filial</CardTitle>
          <CardDescription>Distribuição de vagas por filial</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vagasPorFilial?.map(({ filial, count, livres, ocupadas }) => (
              <div key={filial.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{filial.nome}</h3>
                    <Badge variant={filial.ativo ? "default" : "secondary"}>
                      {filial.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{filial.codigo}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Livres</p>
                    <p className="text-2xl font-bold text-green-600">{livres}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Ocupadas</p>
                    <p className="text-2xl font-bold text-primary">{ocupadas}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Número ou descrição da vaga..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-vaga"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filial-filter">Filial</Label>
              <Select value={selectedFilialFilter} onValueChange={setSelectedFilialFilter}>
                <SelectTrigger id="filial-filter" data-testid="select-filial-filter">
                  <SelectValue placeholder="Todas as filiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as filiais</SelectItem>
                  {filiais?.map((filial) => (
                    <SelectItem key={filial.id} value={filial.id}>
                      {filial.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vagas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Vagas</CardTitle>
          <CardDescription>
            {filteredVagas?.length || 0} vaga(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVagas && filteredVagas.length > 0 ? (
            <div className="space-y-2">
              {filteredVagas.map((vaga) => (
                <div
                  key={vaga.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`vaga-item-${vaga.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ParkingSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Vaga {vaga.numero}</h3>
                        <Badge variant={vaga.status === "livre" ? "default" : "secondary"}>
                          {vaga.status === "livre" ? "Livre" : "Ocupada"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getFilialNome(vaga.filialId)}
                      </p>
                      {vaga.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">{vaga.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(vaga)}
                      data-testid={`button-edit-vaga-${vaga.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDeleteDialog(vaga)}
                      disabled={vaga.status === "ocupada"}
                      data-testid={`button-delete-vaga-${vaga.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ParkingSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma vaga encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Vaga Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Vaga</DialogTitle>
            <DialogDescription>
              Adicione uma nova vaga de estacionamento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filial">Filial *</Label>
                <Select
                  value={formData.filialId}
                  onValueChange={(value) => setFormData({ ...formData, filialId: value })}
                >
                  <SelectTrigger id="filial" data-testid="select-filial">
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {filiais?.filter(f => f.ativo).map((filial) => (
                      <SelectItem key={filial.id} value={filial.id}>
                        {filial.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número da Vaga *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Ex: A-01, B-15, 101"
                  required
                  data-testid="input-numero"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Próximo ao portão principal, Vaga coberta"
                  data-testid="input-descricao"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewDialog(false)}
                data-testid="button-cancelar-nova"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createVagaMutation.isPending || !formData.filialId || !formData.numero}
                data-testid="button-criar-vaga"
              >
                {createVagaMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Vaga"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vaga Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Vaga</DialogTitle>
            <DialogDescription>
              Atualize as informações da vaga
            </DialogDescription>
          </DialogHeader>
          {editingVaga && (
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Filial</Label>
                  <Input
                    value={getFilialNome(editingVaga.filialId)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-numero">Número da Vaga *</Label>
                  <Input
                    id="edit-numero"
                    value={editFormData.numero}
                    onChange={(e) => setEditFormData({ ...editFormData, numero: e.target.value })}
                    placeholder="Ex: A-01, B-15, 101"
                    required
                    data-testid="input-edit-numero"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Textarea
                    id="edit-descricao"
                    value={editFormData.descricao}
                    onChange={(e) => setEditFormData({ ...editFormData, descricao: e.target.value })}
                    placeholder="Ex: Próximo ao portão principal, Vaga coberta"
                    data-testid="input-edit-descricao"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  data-testid="button-cancelar-edit"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateVagaMutation.isPending || !editFormData.numero}
                  data-testid="button-salvar-vaga"
                >
                  {updateVagaMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a vaga <strong>{deletingVaga?.numero}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmar-delete"
            >
              {deleteVagaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
