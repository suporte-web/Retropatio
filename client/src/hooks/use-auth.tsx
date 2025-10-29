import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import type { User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, setTokens, clearTokens, getRefreshToken } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthResponse, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  nome: string;
};

type AuthResponse = {
  user: SelectUser;
  accessToken: string;
  refreshToken: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/login", credentials, false);
      return await res.json();
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${data.user.nome}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/register", credentials, false);
      return await res.json();
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Registro realizado",
        description: `Bem-vindo, ${data.user.nome}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      await apiRequest("POST", "/api/logout", { refreshToken });
    },
    onSuccess: () => {
      clearTokens();
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    },
    onError: (error) => {
      clearTokens();
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
