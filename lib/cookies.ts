// Client-side cookie utilities — works in TV browsers that block localStorage

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
  } catch {
    // TV browsers may restrict cookie writes
  }
}

export function getCookieJson<T>(name: string, fallback: T): T {
  const raw = getCookie(name);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setCookieJson(name: string, value: unknown, days = 365): void {
  setCookie(name, JSON.stringify(value), days);
}
