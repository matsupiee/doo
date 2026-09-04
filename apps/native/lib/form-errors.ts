/** Pulls the first human-readable message out of a TanStack Form error map entry. */
export function getErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error)) {
    for (const issue of error) {
      const message = getErrorMessage(issue);
      if (message) {
        return message;
      }
    }
    return null;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown };
    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
  }

  return null;
}

type AuthError = {
  message?: string;
  code?: string;
  status?: number;
  statusText?: string;
};

/**
 * Better Auth only fills `message` when the server answered with a JSON error
 * body. A 500 from an unmigrated database, or a proxy swallowing the request,
 * arrives with an empty body — so fall back to the status instead of showing a
 * bare "Failed to …" that says nothing about what went wrong.
 */
export function getAuthErrorMessage(error: AuthError | undefined, fallback: string): string {
  if (error?.message) {
    return error.message;
  }

  const status = [error?.status, error?.statusText].filter(Boolean).join(" ");

  return status ? `${fallback} (${status})` : fallback;
}
