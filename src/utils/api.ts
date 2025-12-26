import axios from "axios";
import { TOKEN_KEY, USER_KEY } from "./constants";

// Função para criar instância do axios com baseURL dinâmica
const createApi = (baseURL?: string) => {
  const api = axios.create({
    baseURL: baseURL || import.meta.env.VITE_API_BACKEND,
  });

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      // console.log("🔐 Token no interceptor:", token); // DEBUG
      // console.log("🌐 URL da requisição:", config.url); // DEBUG

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.log("✅ Token adicionado aos headers"); // DEBUG
      } else {
        console.log("❌ Nenhum token encontrado"); // DEBUG
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log("🚨 ERRO DETALHADO:");
      console.log("📊 Status:", error.response?.status);
      console.log("📝 Mensagem:", error.response?.data?.message);
      console.log("🔗 URL:", error.config?.url);
      console.log("📋 Data enviada:", error.config?.data);
      console.log("🧾 Headers:", error.config?.headers);

      if (error.response?.status === 401) {
        console.log("🔒 Token expirado - removendo...");
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } else if (error.response?.status === 403) {
        console.log("🚫 Acesso negado - verifique as permissões do usuário");
        // Mantém o token, só mostra erro
      }

      return Promise.reject(error);
    }
  );

  return api;
};

// Instância padrão
const Api = createApi();

export { Api, createApi };
