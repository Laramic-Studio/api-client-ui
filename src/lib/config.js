// Runtime config for the web client at app.noidr.dev
// API at noidr.dev/api. Local dev can use http://noidr-api.test/api (CORS) or /api proxy.

export const API_URL = (import.meta.env.VITE_API_URL || "http://noidr-api.test/api").replace(/\/$/, "");
export const DOCS_URL = (import.meta.env.VITE_DOCS_URL || "http://noidr-api.test/docs").replace(/\/$/, "");
