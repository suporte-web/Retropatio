import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Permissions, PermissionMap, Role } from "../auth/permissions";

// ===================================
//  TIPO DO USUÁRIO NO FRONT
// ===================================
export type User = {
  id: string;
  nome: string;
  email: string;
  role: Role;
};

// ===================================
//  TIPO DO CONTEXTO
// ===================================
type AuthContextData = {
  user: User | null;
  token: string | null;
  permissions: PermissionMap;
  loading: boolean;
  authError: string | null;
  login: (data: any) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);

// ===================================
//  PROVIDER DE AUTENTICAÇÃO
// ===================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // ===================================
  //  PERMISSÕES DO USUÁRIO (BASE ROLE)
  // ===================================
  const [permissions, setPermissions] = useState<PermissionMap>({
    createEntrada: false,
    viewEntradas: false,
    callMotorista: false,
    manageChecklist: false,
    viewCliente: false,
    viewAdmin: false,
    exportarRelatorio: false,
    editEntrada: false,
    deleteEntrada: false,
  });

  // ===================================
  //  1️⃣ BOOTSTRAP — /auth/me
  // ===================================
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
      cache: "no-store",
    })

      .then(async (res) => {
      if (res.status === 401) throw new Error("unauthorized");

      if (res.status === 304) {
        // força nova requisição sem cache
        const retry = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache",
          },
        });
        return retry.json();
      }

      if (!res.ok) throw new Error("server_error");

      return res.json();
    })
    

      .then((data) => {
        setUser({
          id: data.id,
          nome: data.username,
          email: data.email,
          role: data.role.toUpperCase(),
        });

        setToken(storedToken);
        setAuthError(null);
      })
      .catch((err) => {
        console.warn("Auth bootstrap falhou:", err.message);
        logout();
        setAuthError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ===================================
  //  2️⃣ LOGIN
  // ===================================
 async function login(data: { token: string; user: any }) {
  localStorage.setItem("access_token", data.token);

  setUser({
    id: data.user.id,
    nome: data.user.username,
    email: data.user.email,
    role: data.user.role.toUpperCase(),
  });

  setToken(data.token);
  setAuthError(null);
  setLoading(false);
}



  // ===================================
  //  3️⃣ LOGOUT
  // ===================================
  function logout() {
    setUser(null);
    setToken(null);
    setAuthError(null);

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("selected_filial");
  }

  // ===================================
  //  4️⃣ PERMISSÕES PELO ROLE
  // ===================================
  useEffect(() => {
    if (!user?.role) return;

    const rolePermissions = Permissions[user.role];

    setPermissions({
      createEntrada: !!rolePermissions?.createEntrada,
      viewEntradas: !!rolePermissions?.viewEntradas,
      callMotorista: !!rolePermissions?.callMotorista,
      manageChecklist: !!rolePermissions?.manageChecklist,
      viewCliente: !!rolePermissions?.viewCliente,
      viewAdmin: !!rolePermissions?.viewAdmin,
      exportarRelatorio: !!rolePermissions?.exportarRelatorio,
      editEntrada: !!rolePermissions?.editEntrada,
      deleteEntrada: !!rolePermissions?.deleteEntrada,
    });
  }, [user]);

  // ===================================
  //  PROVIDER
  // ===================================
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        loading,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ===================================
//  HOOK
// ===================================
export function useAuth() {
  return React.useContext(AuthContext);
}
