import { Badge } from "@/components/ui/badge";
import { Shield, User, UserCog } from "lucide-react";

interface RoleBadgeProps {
  role: "porteiro" | "cliente" | "gestor";
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const configs = {
    porteiro: { 
      label: "Porteiro", 
      icon: User, 
      className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
    },
    cliente: { 
      label: "Cliente", 
      icon: User, 
      className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800"
    },
    gestor: { 
      label: "Gestor", 
      icon: Shield, 
      className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
    },
  };

  const config = configs[role];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} gap-1 text-xs font-medium`} data-testid={`badge-role-${role}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
