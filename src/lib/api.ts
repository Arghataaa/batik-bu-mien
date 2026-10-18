// Fetch wrappers for Batik Bu Mien REST API.
// All paths are RELATIVE (e.g. "/api/products") so they go through the
// Next.js dev server / gateway. On non-2xx we throw { message }.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") return data.error;
    if (data && typeof data.message === "string") return data.message;
  } catch {
    // ignore JSON parse failure
  }
  if (res.status === 401) return "Sesi berakhir — silakan masuk kembali.";
  if (res.status === 403) return "Anda tidak memiliki akses untuk aksi ini.";
  if (res.status === 404) return "Data tidak ditemukan.";
  if (res.status >= 500) return "Server bermasalah. Coba lagi nanti.";
  return `Permintaan gagal (${res.status}).`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body
      ? { "Content-Type": "application/json", ...(init?.headers || {}) }
      : { ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) {
    const msg = await parseError(res);
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>("GET", path, undefined, init);
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return request<T>("POST", path, body, init);
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return request<T>("PATCH", path, body, init);
}

export function apiDelete<T = { ok: boolean }>(
  path: string,
  init?: RequestInit
): Promise<T> {
  return request<T>("DELETE", path, undefined, init);
}

/** Upload a single image file to /api/upload. Returns the relative URL. */
export async function apiUploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const msg = await parseError(res);
    throw new ApiError(msg, res.status);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
