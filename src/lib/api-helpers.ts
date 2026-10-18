// Shared API helpers: error formatter, JSON body parser, auth guard wrapper.

import type { Session } from "next-auth";
import { requireAdmin, requireUser } from "@/lib/session";

type SessionUser = NonNullable<Session["user"]>;

/** Convert thrown `Response` (from requireUser/requireAdmin) into JSON error. */
export function jsonError(e: unknown): Response | null {
  if (e instanceof Response) {
    const msg =
      e.status === 401
        ? "Unauthorized"
        : e.status === 403
          ? "Forbidden"
          : e.statusText || "Error";
    return Response.json({ error: msg }, { status: e.status });
  }
  return null;
}

/**
 * Run an async handler with auth guard. Catches thrown `Response` (auth) and
 * unexpected errors, returning a uniform JSON error response.
 */
export async function apiRun<T>(
  fn: () => Promise<T>,
): Promise<Response> {
  try {
    const result = await fn();
    if (result instanceof Response) return result;
    return Response.json(result);
  } catch (e) {
    const authErr = jsonError(e);
    if (authErr) return authErr;
    const msg = e instanceof Error ? e.message : "Internal Server Error";
    return Response.json({ error: msg }, { status: 400 });
  }
}

export async function adminGuard(): Promise<SessionUser> {
  return requireAdmin();
}

export async function userGuard(): Promise<SessionUser> {
  return requireUser();
}

export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
  const text = await request.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Body JSON tidak valid");
  }
}

/** Helper to compute query int with default. */
export function qInt(v: string | null, def: number): number {
  if (v == null || v === "") return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

/** Helper to compute query ISO date filter; returns null if missing. */
export function qDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d;
}
