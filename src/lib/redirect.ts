/**
 * Where to send the user after logging in. Only same-site paths are allowed, so a
 * crafted `?next=https://evil.example` link cannot bounce people off the site.
 */
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}

/** Link to the login page that comes back to `path` afterwards. */
export function loginHref(path: string, page: 'login' | 'signup' = 'login'): string {
  return `/auth/${page}?next=${encodeURIComponent(path)}`;
}
