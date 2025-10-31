import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { Bell, TruckIcon } from "lucide-react";
import type { Chamada, Veiculo } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TVDisplayPage() {
  const filialId = localStorage.getItem("selected_filial");

  // WebSocket para atualizações em tempo real
  useWebSocket();

  // Buscar chamadas pendentes
  const { data: chamadas = [], refetch } = useQuery<Chamada[]>({
    queryKey: ["/api/chamadas", filialId],
    enabled: !!filialId,
    refetchInterval: 10000, // Atualizar a cada 10 segundos como backup
  });

  // Buscar veículos
  const { data: veiculos = [] } = useQuery<Veiculo[]>({
    queryKey: ["/api/veiculos", filialId],
    enabled: !!filialId,
  });

  const chamadasPendentes = chamadas.filter(c => c.status === "pendente");

  // Auto-refresh da página a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-7xl font-bold text-white mb-4 tracking-tight" data-testid="text-title">
          CHAMADAS DE MOTORISTAS
        </h1>
        <div className="flex items-center justify-center gap-4 text-white/80 text-2xl">
          <Bell className="h-8 w-8" />
          <span data-testid="text-time">{format(new Date(), "HH:mm:ss", { locale: ptBR })}</span>
        </div>
      </div>

      {/* Chamadas Pendentes */}
      {chamadasPendentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Bell className="h-32 w-32 text-white/30 mb-8" />
          <p className="text-5xl text-white/50 font-medium">Nenhuma chamada no momento</p>
        </div>
      ) : (
        <div className="grid gap-6 max-w-7xl mx-auto">
          {chamadasPendentes.map((chamada, index) => {
            const veiculo = veiculos.find(v => v.id === chamada.veiculoId);
            return (
              <Card
                key={chamada.id}
                className="bg-white/95 backdrop-blur-sm border-4 border-yellow-400 shadow-2xl animate-pulse"
                data-testid={`chamada-card-${chamada.id}`}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-8">
                    {/* Número da Chamada */}
                    <div className="flex-shrink-0 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-5xl font-bold text-gray-900" data-testid={`text-numero-${chamada.id}`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Informações do Veículo */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <TruckIcon className="h-12 w-12 text-blue-600" />
                        <div>
                          <p className="text-3xl font-bold text-gray-900" data-testid={`text-motorista-${chamada.id}`}>
                            {veiculo?.motorista || "Motorista não identificado"}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-4xl font-mono font-bold text-blue-600" data-testid={`text-placa-${chamada.id}`}>
                              {veiculo?.placaCavalo}
                            </span>
                            {veiculo?.placaCarreta && (
                              <>
                                <span className="text-2xl text-gray-400">+</span>
                                <span className="text-3xl font-mono font-bold text-gray-600" data-testid={`text-placa-carreta-${chamada.id}`}>
                                  {veiculo.placaCarreta}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Motivo da Chamada */}
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <p className="text-2xl text-gray-900 font-medium" data-testid={`text-motivo-${chamada.id}`}>
                          {chamada.motivo}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <p className="text-xl text-gray-500" data-testid={`text-horario-${chamada.id}`}>
                        Chamada às {format(new Date(chamada.createdAt), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>

                    {/* Status Animado */}
                    <div className="flex-shrink-0">
                      <div className="flex flex-col items-center gap-2">
                        <Bell className="h-16 w-16 text-yellow-500 animate-bounce" />
                        <span className="text-2xl font-bold text-yellow-600 uppercase">
                          Aguardando
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-8 left-0 right-0 text-center">
        <p className="text-white/60 text-xl">
          Última atualização: {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
