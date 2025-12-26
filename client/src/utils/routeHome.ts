import type { Role } from "@/auth/permissions";

export function getHomeRoute(role: Role) {
  switch (role) {
    case "ADMIN":
    case "GESTOR":
      return "/gestao";
    case "PORTEIRO":
      return "/portaria";
    case "CLIENTE":
      return "/cliente";
    default:
      return "/auth";
  }
}
