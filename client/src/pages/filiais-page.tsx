import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, MapPin, Edit, Trash2, Power } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Filial } from "@/shared/schema";
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

  // =========================
  // STATES
  // =========================
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [filialToDelete, setFilialToDelete] = useState<Filial | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    endereco: "",
  });

  const [editFormData, setEditFormData] = useState({
    endereco: "",
  });

  // =========================
  // QUERY
  // =========================
  const { data, isLoading } = useQuery({
    queryKey: ["/api/filiais"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/filiais");
      return res.json();
    },
  });

  const filiais: Filial[] = Array.isArray(data) ? data : [];

  // =========================
  // MUTATIONS
  // =========================
  const createFilial = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/filiais", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      toast({ title: "Filial criada com sucesso" });
      setFormData({ nome: "", codigo: "", endereco: "" });
      setShowNewDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro ao criar filial",
        variant: "destructive",
      });
    },
  });

  const updateFilial = useMutation({
    mutationFn: async ({ id, endereco }: { id: string; endereco: string }) => {
      const res = await apiRequest("PUT", `/api/filiais/${id}`, { endereco });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      toast({ title: "Endereço atualizado" });
      setShowEditDialog(false);
      setEditingFilial(null);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const url = ativo
        ? `/api/filiais/${id}/ativar`
        : `/api/filiais/${id}/desativar`;
      const res = await apiRequest("PUT", url);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
    },
  });

  const deleteFilial = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/filiais/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      toast({ title: "Filial excluída" });
      setShowDeleteDialog(false);
      setFilialToDelete(null);
    },
    onError: () => {
      toast({
        title: "Não é possível excluir esta filial",
        description: "Existem registros vinculados.",
        variant: "destructive",
      });
    },
  });

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Filiais</h1>
          <p className="text-muted-foreground">Gerencie as filiais</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Filial
        </Button>
      </div>

      {/* LISTA */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Filiais</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filiais.map((filial) => (
                <Card key={filial.id}>
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <CardTitle>{filial.nome}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{filial.codigo}</Badge>
                        <Badge variant={filial.ativo ? "default" : "outline"}>
                          {filial.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditingFilial(filial);
                          setEditFormData({ endereco: filial.endereco });
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          toggleStatus.mutate({
                            id: filial.id,
                            ativo: !filial.ativo,
                          })
                        }
                      >
                        <Power className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => {
                          setFilialToDelete(filial);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="flex gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {filial.endereco}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== NOVA FILIAL ===== */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Filial</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar a filial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Código</Label>
              <Input
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => createFilial.mutate(formData)}>
              Criar Filial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDITAR ===== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Endereço</DialogTitle>
          </DialogHeader>

          <Label>Endereço</Label>
          <Input
            value={editFormData.endereco}
            onChange={(e) =>
              setEditFormData({ endereco: e.target.value })
            }
          />

          <DialogFooter>
            <Button
              onClick={() =>
                updateFilial.mutate({
                  id: editingFilial!.id,
                  endereco: editFormData.endereco,
                })
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EXCLUIR ===== */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Filial</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{filialToDelete?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteFilial.mutate(filialToDelete!.id)
              }
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
