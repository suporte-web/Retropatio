import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";



// ===================================
//  TIPO DA FILIAL
// ===================================
export type Filial = {
  id: string;
  nome: string;
  codigo?: string;
  endereco?: string;
};

// ===================================
//  TIPO DO CONTEXTO
// ===================================
type FilialContextType = {
  filialId: string | null;
  setFilialId: (id: string) => void;
  filiaisPermitidas: Filial[];
  loading: boolean;
};

export const FilialContext = createContext<FilialContextType>({
  filialId: null,
  setFilialId: () => {},
  filiaisPermitidas: [],
  loading: false,
});

// ===================================
//  HOOK
// ===================================
export function useFilial() {
  return useContext(FilialContext);
}

// ===================================
//  PROVIDER
// ===================================
export function FilialProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [filialId, setFilialIdState] = useState<string | null>(() => {
    return localStorage.getItem("selected_filial");
  });

  const [filiaisPermitidas, setFiliaisPermitidas] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);

  // ===================================
  //  CARREGAR FILIAIS DO USUÁRIO
  // ===================================
  useEffect(() => {
    // ⏳ Aguarda auth finalizar
    if (authLoading) {
      setLoading(true);
      return;
    }

    // ❌ Não logado → não bloqueia app
    if (!user) {
      setFiliaisPermitidas([]);
      setFilialIdState(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch("http://localhost:5000/api/filiais/perfil", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro ao buscar filiais");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          setFiliaisPermitidas([]);
          return;
        }

        const filiais = data.map((filial: any) => ({
          id: filial.id,
          nome: filial.nome,
          codigo: filial.codigo,
          endereco: filial.endereco,
        }));

        setFiliaisPermitidas(filiais);

        // Auto-seleciona se só houver uma
        if (!filialId && filiais.length === 1) {
          setFilialId(filiais[0].id);
        }
      })
      .catch((err) => {
        console.error("Erro carregando filiais:", err);
        setFiliaisPermitidas([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, authLoading]);

  // ===================================
  //  SET FILIAL + PERSISTÊNCIA
  // ===================================
  const setFilialId = (id: string) => {
    setFilialIdState(id);
    localStorage.setItem("selected_filial", id);
  };

  return (
    <FilialContext.Provider
      value={{
        filialId,
        setFilialId,
        filiaisPermitidas,
        loading,
      }}
    >
      {children}
    </FilialContext.Provider>
  );
}
