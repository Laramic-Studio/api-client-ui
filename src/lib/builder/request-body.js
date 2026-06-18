import { interpolate } from "@/lib/mockEngine";

/**
 * Builds the fetch body + default Content-Type for real-mode sends.
 * Form data uses application/x-www-form-urlencoded (URLSearchParams).
 */
export function prepareFetchBody(body, method, env) {
  if (!body || body.type === "none" || ["GET", "HEAD"].includes(method)) {
    return { fetchBody: undefined, contentType: null };
  }

  if (body.type === "json") {
    return {
      fetchBody: interpolate(body.content || "", env),
      contentType: "application/json",
    };
  }

  if (body.type === "raw") {
    return {
      fetchBody: interpolate(body.content || "", env),
      contentType: body.contentType || "text/plain",
    };
  }

  if (body.type === "xml") {
    return {
      fetchBody: interpolate(body.content || "", env),
      contentType: body.contentType || "application/xml",
    };
  }

  if (body.type === "form") {
    const params = new URLSearchParams();
    (body.formRows || [])
      .filter((row) => row.enabled !== false && row.key)
      .forEach((row) => params.append(row.key, interpolate(row.value || "", env)));
    return {
      fetchBody: params.toString(),
      contentType: "application/x-www-form-urlencoded",
    };
  }

  return { fetchBody: undefined, contentType: null };
}

export function countEnabledKvRows(rows) {
  return (rows || []).filter((row) => row.key && row.enabled !== false).length;
}
