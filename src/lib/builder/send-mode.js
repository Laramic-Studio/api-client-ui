/** Automatic send routing — cloud for public APIs, browser for localhost / same-origin. */

function parseTargetUrl(url) {
  try {
    const normalized = String(url ?? "").trim();
    if (!normalized) return null;
    const withScheme = /^https?:\/\//i.test(normalized) ? normalized : `http://${normalized}`;
    return new URL(withScheme);
  } catch {
    return null;
  }
}

export function isLocalTarget(url) {
  const parsed = parseTargetUrl(url);
  if (!parsed) return false;
  const host = parsed.hostname.toLowerCase();
  if (/^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(host)) return true;
  if (/\.(local|localhost)$/.test(host)) return true;
  if (/^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)$/.test(host)) return true;
  return false;
}

export function isSameOriginTarget(url) {
  if (typeof window === "undefined") return false;
  const parsed = parseTargetUrl(url);
  if (!parsed) return false;
  return parsed.origin === window.location.origin;
}

/**
 * @returns {{ viaProxy: boolean, route: 'cloud'|'browser', label: string, localFallback?: boolean }}
 */
export function resolveSendRoute({ url, forceCloud = false }) {
  if (forceCloud) {
    if (isLocalTarget(url)) {
      return { viaProxy: false, route: "browser", label: "Browser", localFallback: true };
    }
    return { viaProxy: true, route: "cloud", label: "Cloud" };
  }

  if (isLocalTarget(url) || isSameOriginTarget(url)) {
    return { viaProxy: false, route: "browser", label: "Browser" };
  }

  return { viaProxy: true, route: "cloud", label: "Cloud" };
}
