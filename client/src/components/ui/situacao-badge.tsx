import { Badge } from "@/components/ui/badge";

const mapaCores: Record<string, string> = {
  aguardando: "bg-amber-50 text-amber-700 border-amber-300",
  carregando: "bg-purple-50 text-purple-700 border-purple-300",
  descarregando: "bg-cyan-50 text-cyan-700 border-cyan-300",
  docado: "bg-blue-50 text-blue-700 border-blue-300",
  finalizado: "bg-emerald-50 text-emerald-700 border-emerald-300",
  cancelado: "bg-red-50 text-red-700 border-red-300",
};

export function SituacaoBadge({ situacao }: { situacao: string }) {
  return (
    <Badge className={mapaCores[situacao] || ""}>
      {situacao}
    </Badge>
  );
}
