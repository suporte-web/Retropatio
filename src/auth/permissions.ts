// src/auth/permissions.ts

// Perfis possíveis no sistema
export type Role = "PORTEIRO" | "GESTOR" | "CLIENTE" | "ADMIN";

// Aqui definimos os "flags" de permissão por perfil
export const Permissions = {
  PORTEIRO: {
    createEntrada: true,
    viewEntradas: true,
    callMotorista: true,
    manageChecklist: false,
    viewCliente: false,
    viewAdmin: false,
    exportarRelatorio: false,
    editEntrada: false,
    deleteEntrada: false,
  },
  CLIENTE: {
    createEntrada: false,
    viewEntradas: true,
    callMotorista: false,
    manageChecklist: false,
    viewCliente: true,
    viewAdmin: false,
    exportarRelatorio: true,
    editEntrada: false,
    deleteEntrada: false,
  },
  GESTOR: {
    createEntrada: true,
    viewEntradas: true,
    callMotorista: true,
    manageChecklist: true,
    viewCliente: true,
    viewAdmin: true,
    exportarRelatorio: true,
    editEntrada: true,
    deleteEntrada: true,
  },
  ADMIN: {
    // Admin = mesmo nível do GESTOR (pode ajustar depois se quiser)
    createEntrada: true,
    viewEntradas: true,
    callMotorista: true,
    manageChecklist: true,
    viewCliente: true,
    viewAdmin: true,
    exportarRelatorio: true,
    editEntrada: true,
    deleteEntrada: true,
  },
} as const;

// Tipo das chaves de permissão (ex: "createEntrada", "viewEntradas", etc)
export type PermissionKey = keyof (typeof Permissions)["GESTOR"];

// Tipo que representa o objeto de permissões já resolvido para um usuário
export type PermissionMap = {
  [K in PermissionKey]: boolean;
};
