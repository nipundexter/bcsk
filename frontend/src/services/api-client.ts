import "server-only";
import { cookies } from "next/headers";

/**
 * The one place the frontend talks to the backend.
 *
 * Server-only by import: every call from an RSC or Server Action goes container-to-container
 * over the internal URL and never crosses the public internet. Client components must not
 * import this — they call a Server Action, which calls this.
 *
 * Why not fetch directly from components: this is where the session cookie is forwarded,
 * where the `{ data } / { error }` envelope is unwrapped, and where a backend `AppError`
 * becomes a typed `ApiError`. Scattering that across 52 pages is how error handling
 * becomes inconsistent.
 */

const BASE_URL =
  process.env.BACKEND_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  "http://localhost:4000/api/v1";

export type ApiErrorCode =
  | "VALIDATION_FAILED" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND"
  | "CONFLICT" | "UNPROCESSABLE" | "RATE_LIMITED" | "MISCONFIGURED"
  | "UPSTREAM_FAILED" | "INTERNAL" | "NETWORK";

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number,
    readonly details?: Record<string, unknown>,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Forward the caller's session cookie. Off for genuinely public reads. */
  auth?: boolean;
  /** Next cache directives. Public content is cacheable; anything per-user is not. */
  revalidate?: number | false;
  tags?: string[];
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, revalidate = false, tags, headers = {} } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) requestHeaders["content-type"] = "application/json";

  if (auth) {
    // Forward the browser's httpOnly cookie so the backend sees the same session the web
    // surface already established. The frontend never handles the token itself.
    const jar = await cookies();
    const session = jar.get("bcsk_session")?.value;
    if (session) requestHeaders["cookie"] = `bcsk_session=${session}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Per-user data must never be cached; public reads opt in explicitly.
      cache: revalidate === false ? "no-store" : undefined,
      next: revalidate === false ? undefined : { revalidate, tags },
    });
  } catch (e) {
    // A backend that is down is an infrastructure failure, not a user error.
    throw new ApiError("NETWORK", "The service is temporarily unavailable.", 503, {
      cause: e instanceof Error ? e.message : String(e),
    });
  }

  if (res.status === 204) return undefined as T;

  const payload = (await res.json().catch(() => null)) as
    | { data?: T; meta?: unknown; error?: { code: ApiErrorCode; message: string; details?: Record<string, unknown>; requestId?: string } }
    | null;

  if (!res.ok || payload?.error) {
    const err = payload?.error;
    throw new ApiError(
      err?.code ?? "INTERNAL",
      err?.message ?? "Something went wrong.",
      res.status,
      err?.details,
      err?.requestId,
    );
  }
  return payload?.data as T;
}

/**
 * Upload a file. Multipart, so it bypasses the JSON body handling above but keeps the same
 * cookie forwarding and error mapping.
 */
async function upload(file: File, folder: string): Promise<{ path: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const headers: Record<string, string> = {};
  const jar = await cookies();
  const session = jar.get("bcsk_session")?.value;
  if (session) headers["cookie"] = `bcsk_session=${session}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/files`, { method: "POST", headers, body: form, cache: "no-store" });
  } catch (e) {
    throw new ApiError("NETWORK", "The service is temporarily unavailable.", 503, {
      cause: e instanceof Error ? e.message : String(e),
    });
  }
  const payload = (await res.json().catch(() => null)) as
    | { data?: { path: string }; error?: { code: ApiErrorCode; message: string; requestId?: string } }
    | null;
  if (!res.ok || payload?.error) {
    const err = payload?.error;
    throw new ApiError(err?.code ?? "INTERNAL", err?.message ?? "Upload failed.", res.status, undefined, err?.requestId);
  }
  return payload!.data!;
}

export const api = {
  upload,
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),

  /** Public reads: no cookie, and cacheable. */
  public: <T>(path: string, revalidate = 60, tags?: string[]) =>
    request<T>(path, { method: "GET", auth: false, revalidate, tags }),
};

/**
 * Convert an ApiError into the `{ error }` shape Server Actions return to `useActionState`.
 * Unexpected failures are re-thrown so they reach the error boundary and the logs rather
 * than being rendered as a form message.
 */
export function toActionError(e: unknown): { error: string } {
  if (e instanceof ApiError) {
    if (e.status >= 500) return { error: "Something went wrong on our side. Please try again." };
    return { error: e.message };
  }
  throw e;
}
