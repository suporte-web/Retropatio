import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useFilial } from "@/contexts/FilialContext";

type WebSocketMessage = {
  type: string;
  data: any;
};

export function useWebSocket(enabled: boolean) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // 🔹 flag para evitar loop infinito
  const shouldReconnectRef = useRef(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ⚠️ CONTEXTOS SÃO USADOS APENAS PARA DADOS
  // ❌ NÃO controlam se conecta ou não
  const { user } = useAuth();
  const { filialId } = useFilial();

  // ===============================
  //  FUNÇÃO DE CONEXÃO
  // ===============================
  const connect = () => {
    if (!enabled) return;

    // já conectado ou conectando
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?filialId=${filialId}`;

    console.log("🔌 WebSocket conectando:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket conectado");
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case "veiculo_entrada":
          case "veiculo_saida":
            queryClient.invalidateQueries({ queryKey: ["/api/veiculos"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });

            if (message.type === "veiculo_entrada") {
              toast({
                title: "Nova Entrada",
                description: `Veículo ${message.data?.placaCavalo ?? ""}`,
              });
            }
            break;

          case "vaga_updated":
            queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
            break;

          case "visitante_novo":
            queryClient.invalidateQueries({
              queryKey: ["/api/visitantes", filialId],
            });
            toast({
              title: "Novo Visitante",
              description: message.data?.nome,
            });
            break;

          case "chamada_nova":
            queryClient.invalidateQueries({ queryKey: ["/api/chamadas"] });
            toast({
              title: "Nova Chamada",
              description: message.data?.motivo,
            });
            break;

          default:
            console.log("ℹ️ Evento WS ignorado:", message.type);
        }
      } catch (err) {
        console.error("Erro ao processar mensagem WS:", err);
      }
    };

    ws.onerror = () => {
      console.warn("⚠️ WebSocket indisponível (ignorado)");
    };

    ws.onclose = (event) => {
      wsRef.current = null;

      if (event.code === 1006) {
        console.info("ℹ️ WS fechado (1006)");
      } else {
        console.log("🔌 WebSocket fechado", event.code, event.reason);
      }

      // 🔁 reconecta SOMENTE se permitido
      if (shouldReconnectRef.current && enabled) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  };

  // ===============================
  //  EFFECT PRINCIPAL (CONTROLADO)
  // ===============================
  
  useEffect(() => {
    if (!enabled) return;

    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, filialId]);
}
