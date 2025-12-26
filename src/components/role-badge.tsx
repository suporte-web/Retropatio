import { Badge } from "@/components/ui/badge";
import { Shield, User, UserCog, HelpCircle } from "lucide-react";

interface RoleBadgeProps {
  role?: string; // pode vir null, undefined ou string inválida
}

export function RoleBadge({ role }: RoleBadgeProps) {
  // mapa confiável de papéis permitidos
  const configs: Record<string, { label: string; icon: any; className: string }> = {
    porteiro: {
      label: "Porteiro",
      icon: User,
      className:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
    },
    cliente: {
      label: "Cliente",
      icon: UserCog,
      className:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800",
    },
    gestor: {
      label: "Gestor",
      icon: Shield,
      className:
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
    },
  };

  // se vier vazio, errado ou desconhecido → fallback seguro
  const config =
    (role && configs[role.toLowerCase()]) || {
      label: "Sem função",
      icon: HelpCircle,
      className:
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} gap-1 text-xs font-medium`}
      data-testid={`badge-role-${role || "none"}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
