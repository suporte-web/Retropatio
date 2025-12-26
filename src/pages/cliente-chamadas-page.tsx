import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneCall, Truck, Loader2, X, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Veiculo, Filial } from "@/shared/schema";


export default function ClienteChamadasPage() {
  const { toast } = useToast();
  const filialId = localStorage.getItem("selected_filial");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [motivo, setMotivo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if current filial is Costeira
  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
    enabled: !!filialId,
  });
  
  const filial = filiais?.find(f => f.id === filialId);

  const { data: veiculos, isLoading } = useQuery<Veiculo[]>({
    queryKey: ["/api/veiculos", filialId],
    enabled: !!filialId,
  });

  const createChamadaMutation = useMutation({
    mutationFn: async (data: { veiculoId: string; motivo: string }) => {
      const res = await apiRequest("POST", "/api/chamadas", {
        ...data,
        filialId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chamadas", filialId] });
      toast({
        title: "Chamada criada",
        description: "O motorista será notificado",
      });
      setDialogOpen(false);
      setSelectedVeiculo(null);
      setMotivo("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar chamada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChamar = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedVeiculo || !motivo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o motivo da chamada",
        variant: "destructive",
      });
      return;
    }

    createChamadaMutation.mutate({
      veiculoId: String(selectedVeiculo.id),
      motivo: motivo.trim(),
    });
  };

  // Filter vehicles in patio (not finished)
  const veiculosNoPatio = veiculos?.filter((v) => !v.dataSaida) || [];

  // Filter by search term
  const filteredVeiculos = veiculosNoPatio.filter((v) =>
    v.placaCavalo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.motorista.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.transportadora ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if filial is Costeira
  const isFilialCosteira = filial?.codigo === "costeira";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Chamadas de Motoristas</h1>
        <p className="text-muted-foreground">Chame motoristas para carregar ou descarregar</p>
      </div>

      {/* Filial Restriction Message */}
      {filial && !isFilialCosteira && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              Funcionalidade Disponível Apenas para Filial Costeira
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Esta funcionalidade de chamadas de motoristas está disponível apenas para a filial Costeira.
              Você está atualmente conectado à filial: <strong>{filial.nome}</strong>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Only show content if Costeira */}
      {isFilialCosteira && (
        <>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Veículo</CardTitle>
          <CardDescription>Pesquise por placa, motorista ou transportadora</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-veiculo"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicles List */}
      <Card>
        <CardHeader>
          <CardTitle>Veículos no Pátio ({filteredVeiculos.length})</CardTitle>
          <CardDescription>Selecione um veículo para chamar o motorista</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredVeiculos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVeiculos.map((veiculo) => (
                <Card key={veiculo.id} className="hover-elevate" data-testid={`card-veiculo-${veiculo.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">
                          {veiculo.placaCarreta
                            ? `${veiculo.placaCavalo} + ${veiculo.placaCarreta}`
                            : veiculo.placaCavalo}
                        </CardTitle>
                      </div>
                      <StatusBadge status={veiculo.situacao} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Motorista</p>
                      <p className="text-sm text-muted-foreground">{veiculo.motorista}</p>
                    </div>
                    {veiculo.transportadora && (
                      <div>
                        <p className="text-sm font-medium">Transportadora</p>
                        <p className="text-sm text-muted-foreground">{veiculo.transportadora}</p>
                      </div>
                    )}
                    {veiculo.cliente && (
                      <div>
                        <p className="text-sm font-medium">Cliente</p>
                        <p className="text-sm text-muted-foreground">{veiculo.cliente}</p>
                      </div>
                    )}
                    {veiculo.statusCarga && (
                      <div>
                        <p className="text-sm font-medium">Status Carga</p>
                        <p className="text-sm text-muted-foreground capitalize">{veiculo.statusCarga}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">Entrada</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(veiculo.dataEntrada), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      className="w-full mt-3"
                      onClick={() => handleChamar(veiculo)}
                      data-testid={`button-chamar-${veiculo.id}`}
                    >
                      <PhoneCall className="mr-2 h-4 w-4" />
                      Chamar Motorista
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum veículo encontrado" : "Nenhum veículo no pátio"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {/* Call Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-chamar-motorista">
          <DialogHeader>
            <DialogTitle>Chamar Motorista</DialogTitle>
            <DialogDescription>
              Informe o motivo da chamada para o motorista
            </DialogDescription>
          </DialogHeader>
          {selectedVeiculo && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedVeiculo.placaCarreta
                      ? `${selectedVeiculo.placaCavalo} + ${selectedVeiculo.placaCarreta}`
                      : selectedVeiculo.placaCavalo}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Motorista: <span className="text-foreground">{selectedVeiculo.motorista}</span>
                  </p>
                </div>
                {selectedVeiculo.transportadora && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transportadora:{" "}
                      <span className="text-foreground">{selectedVeiculo.transportadora}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo da Chamada *</Label>
                <Textarea
                  id="motivo"
                  data-testid="textarea-motivo"
                  placeholder="Ex: Carregar mercadoria na Doca 5"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSelectedVeiculo(null);
                setMotivo("");
              }}
              data-testid="button-cancelar-chamada"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createChamadaMutation.isPending || !motivo.trim()}
              data-testid="button-confirmar-chamada"
            >
              {createChamadaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Criar Chamada
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
