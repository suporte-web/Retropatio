export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    localStorage.getItem("access_token") || "mock-access-token";

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Erro na requisição");
  }

  return response.json();
}
