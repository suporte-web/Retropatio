import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Edit, Trash2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vaga, Filial } from "@/shared/schema";
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
import { Badge } from "@/components/ui/badge";

type TipoVaga = {
  Id: number;
  Nome: string;
};

type NewVagaFormData = {
  filialId: string;
  tipoVagaId: number | "";
  NomeVaga: string;
  status: "livre" | "ocupada" | string;
};

type EditVagaFormData = {
  filialId: string;
  tipoVagaId: number | "";
  NomeVaga: string;
  status: "livre" | "ocupada" | string;
};

export default function VagasAdminPage() {
  const { toast } = useToast();

  // =========================
  // STATES
  // =========================

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);


  const [showTipoDialog, setShowTipoDialog] = useState(false);
  const [novoTipoNome, setNovoTipoNome] = useState("");
  const [editandoTipo, setEditandoTipo] = useState<TipoVaga | null>(null);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null);
  const [deletingVaga, setDeletingVaga] = useState<Vaga | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilialFilter, setSelectedFilialFilter] = useState("all");

  const [newFormData, setNewFormData] = useState<NewVagaFormData>({
    filialId: "",
    tipoVagaId: "",
    NomeVaga: "",
    status: "livre",
  });

  const [editFormData, setEditFormData] = useState<EditVagaFormData>({
    filialId: "",
    tipoVagaId: "",
    NomeVaga: "",
    status: "livre",
  });

  // =========================
  // QUERIES
  // =========================
  const { data: vagas, isLoading: isLoadingVagas } = useQuery<Vaga[]>({
    queryKey: ["/api/vagas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vagas");
      return res.json();
    },
  });

  const { data: filiais, isLoading: isLoadingFiliais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/filiais");
      return res.json();
    },
  });

  // ⚠️ Ajuste se o seu endpoint for outro.
  const { data: tiposVaga, isLoading: isLoadingTipos } = useQuery<TipoVaga[]>({
    queryKey: ["/api/tipo-vaga"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/tipo-vaga");
        return res.json();
      } catch {
        const res2 = await apiRequest("GET", "/api/tipos-vaga");
        return res2.json();
      }
    },
  });

  // =========================
  // MUTATIONS
  // =========================

  const createTipoVagaMutation = useMutation({
  mutationFn: async (Nome: string) => {
    const res = await apiRequest("POST", "/api/tipo-vaga", { Nome });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/tipo-vaga"] });
    toast({ title: "Tipo de vaga criado" });
    setNovoTipoNome("");
    setShowTipoDialog(false);
  },
  });

  const updateTipoVagaMutation = useMutation({
  mutationFn: async ({ Id, Nome }: TipoVaga) => {
    const res = await apiRequest("PUT", `/api/tipo-vaga/${Id}`, { Nome });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/tipo-vaga"] });
    toast({ title: "Tipo de vaga atualizado" });
    setEditandoTipo(null);
    setShowTipoDialog(false);
  },
  });


  const createVagaMutation = useMutation({
    mutationFn: async (data: NewVagaFormData) => {
      if (!data.filialId || !data.tipoVagaId || !data.NomeVaga) {
        throw new Error("Preencha filial, tipo e nome da vaga.");
      }

      const payload = {
        filialId: data.filialId,
        tipoVagaId: Number(data.tipoVagaId),
        NomeVaga: data.NomeVaga,
        status: data.status || "livre",
      };

      const res = await apiRequest("POST", "/api/vagas", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({ title: "Vaga criada com sucesso" });
      setNewFormData({ filialId: "", tipoVagaId: "", NomeVaga: "", status: "livre" });
      setShowNewDialog(false);
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao criar vaga",
        description: err?.message || "Erro inesperado",
        variant: "destructive",
      });
    },
  });

  const updateVagaMutation = useMutation({
    mutationFn: async ({
      vagaId,
      filialId,
      tipoVagaId,
      NomeVaga,
      status,
    }: {
      vagaId: number;
      filialId: string;
      tipoVagaId: number;
      NomeVaga: string;
      status: string;
    }) => {
      const payload = {
        filialId, // (opcional no seu back, mas vamos mandar para manter consistente)
        tipoVagaId: Number(tipoVagaId),
        NomeVaga,
        status,
      };

      const res = await apiRequest("PUT", `/api/vagas/${vagaId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({ title: "Vaga atualizada com sucesso" });
      setShowEditDialog(false);
      setEditingVaga(null);
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar vaga",
        description: err?.message || "Erro inesperado",
        variant: "destructive",
      });
    },
  });

  const deleteVagaMutation = useMutation({
    mutationFn: async ({ vagaId, filialId }: { vagaId: number; filialId: string }) => {
      // ✅ Seu back exige filialId no BODY
      const res = await apiRequest("DELETE", `/api/vagas/${vagaId}`, { filialId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({ title: "Vaga removida com sucesso" });
      setShowDeleteDialog(false);
      setDeletingVaga(null);
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao remover vaga",
        description: err?.message || "Erro inesperado",
        variant: "destructive",
      });
    },
  });

  const importVagasMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/vagas/import", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao importar vagas");
    }

    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
    toast({ title: "Vagas importadas com sucesso" });
    setShowImportDialog(false);
    setImportFile(null);
  },
  onError: (err: any) => {
    toast({
      title: "Erro na importação",
      description: err.message,
      variant: "destructive",
    });
  },
});


  // =========================
  // HELPERS
  // =========================
  const getFilialNome = (filialId: string) =>
    filiais?.find((f) => f.id === filialId)?.nome || "Desconhecida";

  const getTipoNome = (tipoVagaId: any) =>
    tiposVaga?.find((t) => t.Id === Number(tipoVagaId))?.Nome || "-";

  const filteredVagas = useMemo(() => {
    const list = vagas ?? [];

    return list.filter((vaga) => {
      const matchesSearch =
        vaga.NomeVaga?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;

      const matchesFilial =
        selectedFilialFilter === "all" || vaga.filialId === selectedFilialFilter;

      return matchesSearch && matchesFilial;
    });
  }, [vagas, searchTerm, selectedFilialFilter]);

  const openEditDialog = (vaga: Vaga) => {
    setEditingVaga(vaga);
    setEditFormData({
      filialId: vaga.filialId,
      tipoVagaId: (vaga as any).tipoVagaId ?? "",
      NomeVaga: vaga.NomeVaga,
      status: (vaga as any).status || "livre",
    });
    setShowEditDialog(true);
  };

  // =========================
  // UI
  // =========================
  const isBusy = isLoadingVagas || isLoadingFiliais || isLoadingTipos;

  return (
    <div className="p-6 space-y-6">

      <input
  ref={fileInputRef}
  type="file"
  accept=".xlsx,.xls"
  hidden
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportDialog(true);
    }
  }}
/>

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Vagas</h1>
          <p className="text-muted-foreground">
            Gerencie as vagas de estacionamento de todas as filiais
          </p>
        </div>

        <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Importar Excel
        </Button>

        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Vaga
        </Button>
      </div>

      </div>

      {/* FILTROS */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre por filial</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: A1, 12, PÁTIO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" size="icon" title="Buscar">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Filial</Label>
            <Select
              value={selectedFilialFilter}
              onValueChange={setSelectedFilialFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(filiais ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      <Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <div>
      <CardTitle>Tipos de Vaga</CardTitle>
      <CardDescription>Cadastre e gerencie os tipos de vaga</CardDescription>
      
    </div>

    <Button size="sm" onClick={() => setShowTipoDialog(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Novo Tipo
    </Button>
  </CardHeader>

  <CardContent className="space-y-2">
    {(tiposVaga ?? []).map((tipo) => (
      <div
        key={tipo.Id}
        className="flex items-center justify-between border rounded-md p-3"
      >
        <span className="font-medium">{tipo.Nome}</span>

        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            setEditandoTipo(tipo);
            setNovoTipoNome(tipo.Nome);
            setShowTipoDialog(true);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    ))}
  </CardContent>
</Card>


      {/* LISTA */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Vagas</CardTitle>
          <CardDescription>
            {filteredVagas.length} vaga(s) encontrada(s)
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isBusy ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredVagas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma vaga encontrada.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredVagas.map((vaga) => (
                <div
                  key={vaga.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Vaga {vaga.NomeVaga}</h3>
                      <Badge variant="secondary">{getTipoNome((vaga as any).tipoVagaId)}</Badge>
                      <Badge variant={(vaga as any).status === "livre" ? "default" : "outline"}>
                        {(vaga as any).status || "livre"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getFilialNome(vaga.filialId)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => openEditDialog(vaga)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => {
                        setDeletingVaga(vaga);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================
          NOVA VAGA (DIALOG)
      ========================= */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Vaga</DialogTitle>
            <DialogDescription>
              Selecione a filial, tipo e informe o nome/número da vaga.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select
                value={newFormData.filialId}
                onValueChange={(v) => setNewFormData((p) => ({ ...p, filialId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  {(filiais ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Vaga</Label>
              <Select
                value={newFormData.tipoVagaId === "" ? "" : String(newFormData.tipoVagaId)}
                onValueChange={(v) =>
                  setNewFormData((p) => ({ ...p, tipoVagaId: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {(tiposVaga ?? []).map((t) => (
                    <SelectItem key={t.Id} value={String(t.Id)}>
                      {t.Nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome / Número da Vaga</Label>
              <Input
                value={newFormData.NomeVaga}
                onChange={(e) =>
                  setNewFormData((p) => ({ ...p, NomeVaga: e.target.value }))
                }
                placeholder="Ex: A12"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newFormData.status}
                onValueChange={(v) =>
                  setNewFormData((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre">livre</SelectItem>
                  <SelectItem value="ocupada">ocupada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => createVagaMutation.mutate(newFormData)}
              disabled={createVagaMutation.isPending}
            >
              {createVagaMutation.isPending ? "Salvando..." : "Criar Vaga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================
          EDITAR VAGA (DIALOG)
      ========================= */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Vaga</DialogTitle>
            <DialogDescription>Atualize os dados da vaga.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select
                value={editFormData.filialId}
                onValueChange={(v) => setEditFormData((p) => ({ ...p, filialId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  {(filiais ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Vaga</Label>
              <Select
                value={editFormData.tipoVagaId === "" ? "" : String(editFormData.tipoVagaId)}
                onValueChange={(v) =>
                  setEditFormData((p) => ({ ...p, tipoVagaId: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {(tiposVaga ?? []).map((t) => (
                    <SelectItem key={t.Id} value={String(t.Id)}>
                      {t.Nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome / Número da Vaga</Label>
              <Input
                value={editFormData.NomeVaga}
                onChange={(e) =>
                  setEditFormData((p) => ({ ...p, NomeVaga: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(v) => setEditFormData((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre">livre</SelectItem>
                  <SelectItem value="ocupada">ocupada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                if (!editingVaga) return;
                if (!editFormData.filialId || !editFormData.tipoVagaId) {
                  toast({
                    title: "Preencha filial e tipo",
                    variant: "destructive",
                  });
                  return;
                }

                updateVagaMutation.mutate({
                  vagaId: Number(editingVaga.id),
                  filialId: editFormData.filialId,
                  tipoVagaId: Number(editFormData.tipoVagaId),
                  NomeVaga: editFormData.NomeVaga,
                  status: editFormData.status,
                });
              }}
              disabled={updateVagaMutation.isPending}
            >
              {updateVagaMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


        {/* =========================
          MODAL DE CRIAR / EDITAR TIPO
      ========================= */}
      <Dialog open={showTipoDialog} onOpenChange={setShowTipoDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {editandoTipo ? "Editar Tipo de Vaga" : "Novo Tipo de Vaga"}
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-2">
      <Label>Nome do Tipo</Label>
      <Input
        value={novoTipoNome}
        onChange={(e) => setNovoTipoNome(e.target.value)}
        placeholder="Ex: Caminhão, Carreta..."
      />
    </div>

    <DialogFooter>
      <Button
        onClick={() => {
          if (!novoTipoNome.trim()) return;

          if (editandoTipo) {
            updateTipoVagaMutation.mutate({
              Id: editandoTipo.Id,
              Nome: novoTipoNome,
            });
          } else {
            createTipoVagaMutation.mutate(novoTipoNome);
          }
        }}
      >
        Salvar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


<Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Importar Vagas</DialogTitle>
      <DialogDescription>
        Envie um arquivo Excel para cadastrar vagas em massa.
      </DialogDescription>
    </DialogHeader>

    <p className="text-sm">
      Arquivo selecionado: <strong>{importFile?.name}</strong>
    </p>

    <DialogFooter>
      <Button
        onClick={() => {
          if (!importFile) {
            toast({
              title: "Selecione um arquivo",
              variant: "destructive",
            });
            return;
          }
          importVagasMutation.mutate(importFile);
        }}
        disabled={importVagasMutation.isPending}
      >
        {importVagasMutation.isPending ? "Importando..." : "Importar"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* =========================
          EXCLUIR (DIALOG)
      ========================= */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Vaga</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a vaga{" "}
              <strong>{deletingVaga?.NomeVaga}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deletingVaga) return;
                deleteVagaMutation.mutate({
                  vagaId: Number(deletingVaga.id),
                  filialId: deletingVaga.filialId,
                });
              }}
              disabled={deleteVagaMutation.isPending}
            >
              {deleteVagaMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

