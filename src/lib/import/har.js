import { emptyImportCollection, normalizeImportUrl, parseHttpMethod } from "@/lib/import/shared";

export function importHarLog(data) {
  const entries = data.log?.entries || [];
  const requests = entries.map((entry) => {
    const req = entry.request || {};
    let url = req.url || "";
    try {
      const parsed = new URL(url);
      url = `${parsed.pathname}${parsed.search || ""}`;
      if (!url.startsWith("/")) url = `/${url}`;
      url = normalizeImportUrl(`[[BASE_URL]]${url}`);
    } catch {
      url = normalizeImportUrl(url);
    }

    const bodyText = req.postData?.text;
    return {
      name: `${req.method || "GET"} ${url}`,
      method: parseHttpMethod(req.method),
      url,
      params: [],
      headers: (req.headers || [])
        .filter((h) => !/^(:|content-length|host|connection)/i.test(h.name || ""))
        .map((h) => ({ key: h.name, value: h.value, enabled: true })),
      auth: { type: "none" },
      body: bodyText
        ? {
            type: bodyText.trim().startsWith("{") ? "json" : "text",
            content: bodyText,
          }
        : { type: "none", content: "" },
      docs: "",
    };
  });

  return {
    ...emptyImportCollection("Imported HAR"),
    requests,
    folders: [],
  };
}
