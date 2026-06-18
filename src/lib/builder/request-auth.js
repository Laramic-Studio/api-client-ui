import { interpolate } from "@/lib/mockEngine";

export function buildOutgoingHeaders(req, env) {
  const headers = [...(req.headers || [])];
  const auth = req.auth || { type: "none" };

  if (auth.type === "bearer" && auth.token) {
    headers.push({
      key: "Authorization",
      value: `Bearer ${interpolate(auth.token, env)}`,
      enabled: true,
    });
  } else if (auth.type === "basic" && auth.username) {
    const cred = btoa(`${auth.username}:${auth.password || ""}`);
    headers.push({ key: "Authorization", value: `Basic ${cred}`, enabled: true });
  } else if (auth.type === "apikey") {
    headers.push({
      key: auth.headerName || "X-API-Key",
      value: interpolate(auth.value || "", env),
      enabled: true,
    });
  }

  return headers;
}

export function enabledHeaderRows(headers) {
  return (headers || []).filter((h) => h.enabled !== false && h.key);
}
