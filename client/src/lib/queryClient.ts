import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Token management
const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("selected_filial");
}

// Refresh token logic
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        throw new Error("Failed to refresh token");
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      return data.accessToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const data = await res.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch {
      const text = await res.text();
      if (text) errorMessage = text;
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  customHeaders?: Record<string, string> | boolean,
): Promise<Response> {
  // If customHeaders is boolean, it's the old retryOnce parameter
  const retryOnce = typeof customHeaders === 'boolean' ? customHeaders : true;
  const additionalHeaders = typeof customHeaders === 'object' ? customHeaders : {};

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add X-Filial header if a filial is selected (unless overridden)
  if (!additionalHeaders["X-Filial"]) {
    const selectedFilial = localStorage.getItem("selected_filial");
    if (selectedFilial) {
      headers["X-Filial"] = selectedFilial;
    }
  }

  // Merge custom headers (they override defaults)
  Object.assign(headers, additionalHeaders);

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // If 401 and we have a refresh token, try to refresh and retry once
  if (res.status === 401 && retryOnce && getRefreshToken()) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;
      
      const retryRes = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      
      await throwIfResNotOk(retryRes);
      return retryRes;
    } catch (error) {
      clearTokens();
      window.location.href = "/auth";
      throw error;
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Add X-Filial header if a filial is selected
      const selectedFilial = localStorage.getItem("selected_filial");
      if (selectedFilial) {
        headers["X-Filial"] = selectedFilial;
      }

      const res = await fetch(queryKey.join("/") as string, { headers });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // If 401 and we have a refresh token, try to refresh and retry once
      if (res.status === 401 && getRefreshToken()) {
        try {
          const newToken = await refreshAccessToken();
          headers["Authorization"] = `Bearer ${newToken}`;
          
          const retryRes = await fetch(queryKey.join("/") as string, { headers });
          
          if (unauthorizedBehavior === "returnNull" && retryRes.status === 401) {
            return null;
          }
          
          await throwIfResNotOk(retryRes);
          return await retryRes.json();
        } catch (error) {
          if (unauthorizedBehavior === "returnNull") {
            clearTokens();
            return null;
          }
          throw error;
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
