import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type WebSocketMessage = {
  type: string;
  data: any;
};

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const filialId = localStorage.getItem("selected_filial");
      
      if (!filialId) {
        console.log("Cannot connect WebSocket: no filial selected");
        return;
      }
      
      const wsUrl = `${protocol}//${window.location.host}/ws?filialId=${encodeURIComponent(filialId)}`;
      
      console.log("Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("WebSocket message received:", message.type, message.data);

          // Get current filialId for query invalidation
          const currentFilialId = localStorage.getItem("selected_filial");

          // Invalidate relevant queries based on event type
          switch (message.type) {
            case "veiculo_entrada":
            case "veiculo_saida":
              queryClient.invalidateQueries({ queryKey: ["/api/veiculos", currentFilialId] });
              queryClient.invalidateQueries({ queryKey: ["/api/veiculos"] });
              queryClient.invalidateQueries({ queryKey: ["/api/vagas", currentFilialId] });
              queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
              
              if (message.type === "veiculo_entrada") {
                toast({
                  title: "Nova Entrada",
                  description: `Veículo ${message.data.placaCavalo} registrado`,
                });
              }
              break;

            case "vaga_updated":
              queryClient.invalidateQueries({ queryKey: ["/api/vagas", currentFilialId] });
              queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
              break;

            case "visitante_novo":
              queryClient.invalidateQueries({ queryKey: ["/api/visitantes", currentFilialId] });
              queryClient.invalidateQueries({ queryKey: ["/api/visitantes"] });
              toast({
                title: "Novo Visitante",
                description: `${message.data.nome} aguardando aprovação`,
              });
              break;

            case "visitante_aprovado":
              queryClient.invalidateQueries({ queryKey: ["/api/visitantes", currentFilialId] });
              queryClient.invalidateQueries({ queryKey: ["/api/visitantes"] });
              toast({
                title: "Visitante Aprovado ✓",
                description: `${message.data.nome} foi aprovado para entrada`,
                duration: 5000,
              });
              break;

            case "visitante_entrada":
            case "visitante_saida":
              queryClient.invalidateQueries({ queryKey: ["/api/visitantes", currentFilialId] });
              queryClient.invalidateQueries({ queryKey: ["/api/visitantes"] });
              break;

            case "chamada_nova":
              queryClient.invalidateQueries({ queryKey: ["/api/chamadas", currentFilialId] });
              queryClient.invalidateQueries({ queryKey: ["/api/chamadas"] });
              toast({
                title: "Nova Chamada",
                description: message.data.motivo,
                variant: "default",
              });
              break;

            case "chamada_atendida":
              queryClient.invalidateQueries({ queryKey: ["/api/chamadas", currentFilialId] });
              queryClient.invalidateQueries({ queryKey: ["/api/chamadas"] });
              break;

            default:
              console.log("Unknown WebSocket message type:", message.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [queryClient, toast]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
