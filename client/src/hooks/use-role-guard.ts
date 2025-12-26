// 🔥 Função para verificar se o usuário pode acessar a rota
export function canAccess(role: string, allowed: string[]) {
  // Admin SEMPRE pode
  if (role === "admin") return true;

  // Verifica se o perfil está na lista de permitidos
  return allowed.includes(role);
}
