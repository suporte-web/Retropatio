import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertCircle, LogOut, X } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "vaga" | "visitante" | "veiculo" | "chamada";
}

export function StatusBadge({ status, type = "veiculo" }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === "vaga") {
      return status === "livre"
        ? { label: "Livre", variant: "default" as const, icon: Check, className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800" }
        : { label: "Ocupado", variant: "secondary" as const, icon: X, className: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800" };
    }
    
    if (type === "visitante") {
      const configs = {
        aguardando: { label: "Aguardando", icon: Clock, className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800" },
        aprovado: { label: "Aprovado", icon: Check, className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800" },
        dentro: { label: "Dentro", icon: Check, className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800" },
        saiu: { label: "Saiu", icon: LogOut, className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" },
      };
      return configs[status as keyof typeof configs] || configs.aguardando;
    }

    if (type === "chamada") {
      const configs = {
        pendente: { label: "Pendente", icon: Clock, className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800" },
        atendida: { label: "Atendida", icon: Check, className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800" },
        cancelada: { label: "Cancelada", icon: X, className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" },
      };
      return configs[status as keyof typeof configs] || configs.pendente;
    }
    
    // veiculo
    const configs = {
      aguardando: { label: "Aguardando", icon: Clock, className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800" },
      docado: { label: "Docado", icon: Check, className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800" },
      carregando: { label: "Carregando", icon: AlertCircle, className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800" },
      descarregando: { label: "Descarregando", icon: AlertCircle, className: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-800" },
      finalizado: { label: "Finalizado", icon: Check, className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800" },
    };
    return configs[status as keyof typeof configs] || configs.aguardando;
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} gap-1 text-xs font-medium`} data-testid={`badge-status-${status}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
