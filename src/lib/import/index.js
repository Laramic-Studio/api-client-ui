import { countImportRequests } from "@/lib/import/shared";
import { importHarLog } from "@/lib/import/har";
import { importInsomniaExport } from "@/lib/import/insomnia";
import { importOpenApiJson, importOpenApiYaml } from "@/lib/import/openapi";
import { importPostmanCollection } from "@/lib/import/postman";

export const IMPORT_FORMATS = [
  { id: "openapi", label: "OpenAPI / YAML" },
  { id: "postman", label: "Postman v2.1" },
  { id: "insomnia", label: "Insomnia v4" },
  { id: "har", label: "HAR (browser export)" },
];

export function detectImportFormat(data, rawText = "") {
  const trimmed = rawText.trim();
  if (trimmed.toLowerCase().startsWith("curl")) return "curl";

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    if (trimmed.startsWith("openapi:") || trimmed.includes("\npaths:")) return "openapi-yaml";
    return "unknown";
  }

  if (data.info && Array.isArray(data.item)) return "postman";
  if (data.openapi || data.swagger) return "openapi";
  if (data._type === "export" && data.__export_format === 4) return "insomnia";
  if (data.log?.entries) return "har";

  return "unknown";
}

export function parseImportContent(raw, { formatHint } = {}) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) {
    return { kind: "error", message: "Paste a spec or choose a file to import." };
  }

  if (formatHint === "openapi") {
    if (trimmed.startsWith("{")) {
      try {
        const data = JSON.parse(trimmed);
        const collection = importOpenApiJson(data);
        if (!collection || countImportRequests(collection) === 0) {
          return { kind: "error", message: "No requests found in OpenAPI document." };
        }
        return { kind: "collection", format: "openapi", collection };
      } catch {
        return { kind: "error", message: "Invalid OpenAPI JSON." };
      }
    }

    const collection = importOpenApiYaml(trimmed);
    if (!collection || countImportRequests(collection) === 0) {
      return { kind: "error", message: "No paths found in OpenAPI YAML." };
    }
    return { kind: "collection", format: "openapi", collection };
  }

  if (formatHint === "har") {
    try {
      const data = JSON.parse(trimmed);
      const collection = importHarLog(data);
      if (countImportRequests(collection) === 0) {
        return { kind: "error", message: "No requests found in HAR file." };
      }
      return { kind: "collection", format: "har", collection };
    } catch {
      return { kind: "error", message: "Invalid HAR JSON." };
    }
  }

  let data;
  try {
    data = JSON.parse(trimmed);
  } catch {
    if (formatHint === "postman" || formatHint === "insomnia") {
      return { kind: "error", message: "Invalid JSON for this format." };
    }
    const yamlCollection = importOpenApiYaml(trimmed);
    if (yamlCollection && countImportRequests(yamlCollection) > 0) {
      return { kind: "collection", format: "openapi", collection: yamlCollection };
    }
    return { kind: "error", message: "Invalid JSON. Supported formats: OpenAPI, Postman, Insomnia, HAR." };
  }

  const detected = formatHint || detectImportFormat(data, trimmed);

  if (detected === "postman" || (formatHint === "postman" && data.info)) {
    const collection = importPostmanCollection(data);
    if (countImportRequests(collection) === 0) {
      return { kind: "error", message: "No requests found in Postman collection." };
    }
    return { kind: "collection", format: "postman", collection };
  }

  if (detected === "insomnia" || formatHint === "insomnia") {
    const collection = importInsomniaExport(data);
    if (countImportRequests(collection) === 0) {
      return { kind: "error", message: "No requests found in Insomnia export." };
    }
    return { kind: "collection", format: "insomnia", collection };
  }

  if (detected === "openapi" || formatHint === "openapi") {
    const collection = importOpenApiJson(data);
    if (!collection || countImportRequests(collection) === 0) {
      return { kind: "error", message: "No requests found in OpenAPI document." };
    }
    return { kind: "collection", format: "openapi", collection };
  }

  if (detected === "har" || formatHint === "har") {
    const collection = importHarLog(data);
    if (countImportRequests(collection) === 0) {
      return { kind: "error", message: "No requests found in HAR file." };
    }
    return { kind: "collection", format: "har", collection };
  }

  return {
    kind: "error",
    message: "Unrecognized format. Try OpenAPI, Postman v2.1, Insomnia v4, or HAR.",
  };
}

export { countImportRequests, flattenImportPreview } from "@/lib/import/shared";
