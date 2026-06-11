/**
 * Shared fetch wrapper that injects the Authorization header from the access token.
 * Use this instead of raw fetch() for all authenticated API calls.
 */
export async function apiFetch(
  url: string,
  accessToken: string | null,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }
  return res;
}
