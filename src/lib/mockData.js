// Realistic mock dataset for Noidr Web. Loaded once into the Zustand store.
import { nanoUid } from "@/lib/generators";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "WS", "SSE", "GRPC"];

const workspaceSeeds = [
  "Personal", "Frontstac", "Client Project", "Acme Corp", "Stripe Sandbox",
  "Internal Tools", "Mobile Team", "Data Platform", "Auth Service", "Billing API",
];

const collectionSeeds = [
  { name: "Users API", base: "/users", folders: ["Profiles", "Sessions"] },
  { name: "Authentication", base: "/auth", folders: ["OAuth", "Tokens"] },
  { name: "Payments", base: "/payments", folders: ["Intents", "Webhooks"] },
  { name: "Orders", base: "/orders", folders: ["Active", "Archived"] },
  { name: "Products", base: "/products", folders: [] },
  { name: "Webhooks", base: "/webhooks", folders: [] },
  { name: "Analytics", base: "/analytics", folders: [] },
  { name: "Notifications", base: "/notifications", folders: [] },
  { name: "Files", base: "/files", folders: [] },
  { name: "Admin", base: "/admin", folders: [] },
  { name: "Search", base: "/search", folders: [] },
  { name: "Reports", base: "/reports", folders: [] },
  { name: "Geo", base: "/geo", folders: [] },
  { name: "Tags", base: "/tags", folders: [] },
  { name: "Reviews", base: "/reviews", folders: [] },
  { name: "Comments", base: "/comments", folders: [] },
  { name: "Posts", base: "/posts", folders: [] },
  { name: "Categories", base: "/categories", folders: [] },
  { name: "Inventory", base: "/inventory", folders: [] },
  { name: "Shipping", base: "/shipping", folders: [] },
  { name: "Subscriptions", base: "/subscriptions", folders: [] },
  { name: "Invoices", base: "/invoices", folders: [] },
  { name: "Teams", base: "/teams", folders: [] },
  { name: "Sessions", base: "/sessions", folders: [] },
  { name: "Health", base: "/health", folders: [] },
];

const reqVerbs = ["list", "get", "create", "update", "delete", "search", "archive"];

function buildRequestsForCollection(collection, folderIds = []) {
  const reqs = [];
  const count = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const verb = reqVerbs[i % reqVerbs.length];
    const method =
      verb === "list" || verb === "get" || verb === "search"
        ? "GET"
        : verb === "create"
        ? "POST"
        : verb === "update"
        ? "PUT"
        : verb === "archive"
        ? "PATCH"
        : "DELETE";
    const idPath = ["get", "update", "delete", "archive"].includes(verb) ? "/:id" : "";
    const suffix = verb === "search" ? "/search" : "";
    reqs.push({
      id: nanoUid("req"),
      name: `${verb[0].toUpperCase() + verb.slice(1)} ${collection.name.replace(/ API$/, "")}`,
      method,
      url: `[[BASE_URL]]${collection.base}${idPath}${suffix}`,
      params: [],
      headers: [{ key: "Accept", value: "application/json", enabled: true }],
      auth: { type: "bearer", token: "[[TOKEN]]" },
      body: { type: "none", content: "" },
      tests: "expect(response.status).toBe(200);",
      preScript: "",
      starred: Math.random() > 0.7,
      docs: "",
      examples: [],
      folderId: folderIds.length && Math.random() > 0.5 ? folderIds[i % folderIds.length] : null,
      order: i,
    });
  }
  return reqs;
}

function seedWorkspaces() {
  return workspaceSeeds.map((name, i) => ({
    id: nanoUid("ws"),
    name,
    description: i === 0 ? "Your personal sandbox" : `${name} team workspace`,
    members: 1 + Math.floor(Math.random() * 8),
    createdAt: Date.now() - (i + 1) * 86400000 * 5,
  }));
}

function seedEnvironments(workspaceId) {
  return [
    {
      id: nanoUid("env"), workspaceId, collectionId: null,
      name: "Local", active: true,
      variables: [
        { key: "BASE_URL", value: "http://localhost:8000", enabled: true },
        { key: "TOKEN", value: "dev-local-token", enabled: true },
        { key: "API_KEY", value: "local-api-key-123", enabled: true },
      ],
    },
    {
      id: nanoUid("env"), workspaceId, collectionId: null,
      name: "Staging", active: false,
      variables: [
        { key: "BASE_URL", value: "https://staging.api.noidr.dev", enabled: true },
        { key: "TOKEN", value: "stg_tok_abc123", enabled: true },
        { key: "API_KEY", value: "stg-key-456", enabled: true },
      ],
    },
    {
      id: nanoUid("env"), workspaceId, collectionId: null,
      name: "Production", active: false,
      variables: [
        { key: "BASE_URL", value: "https://api.noidr.dev", enabled: true },
        { key: "TOKEN", value: "prod_tok_xyz789", enabled: true },
        { key: "API_KEY", value: "prod-key-789", enabled: true },
      ],
    },
  ];
}

function seedHistory(collections, count = 50) {
  const flat = collections.flatMap((c) => c.requests.map((r) => ({ ...r, collectionName: c.name })));
  return Array.from({ length: count }, (_, i) => {
    const r = flat[i % flat.length] || { method: "GET", url: "https://api.example.com/ping", collectionName: "Misc" };
    const status = [200, 201, 204, 304, 400, 401, 404, 500][Math.floor(Math.random() * 8)];
    return {
      id: nanoUid("hist"),
      method: r.method,
      url: r.url.replace("[[BASE_URL]]", "https://api.noidr.dev").replace("{{BASE_URL}}", "https://api.noidr.dev"),
      status,
      durationMs: Math.floor(40 + Math.random() * 900),
      sizeBytes: Math.floor(180 + Math.random() * 5800),
      timestamp: Date.now() - i * 60000 * (Math.random() * 30 + 1),
      favorite: Math.random() > 0.85,
      collectionName: r.collectionName,
    };
  });
}

function seedTeam(count = 20) {
  const names = [
    "Aarav Mehta", "Sara Kim", "James O'Connor", "Mei Chen", "Lucas Silva",
    "Priya Sharma", "Yuki Tanaka", "Noah Williams", "Elena García", "Daniel Ahmadi",
    "Ola Berg", "Hana Park", "Marco Rossi", "Fatima Al-Hassan", "Owen Reed",
    "Ines Dubois", "Tomás Pereira", "Anya Petrova", "Kenji Sato", "Maya Patel",
  ];
  const roles = ["Owner", "Admin", "Developer", "Viewer"];
  return names.slice(0, count).map((name, i) => ({
    id: nanoUid("usr"),
    name,
    email: name.toLowerCase().replace(/[^a-z]+/g, ".") + "@noidr.dev",
    role: i === 0 ? "Owner" : roles[(i % 3) + 1],
    lastActive: Date.now() - Math.floor(Math.random() * 86400000 * 7),
    online: Math.random() > 0.6,
  }));
}

function seedMockServers(count = 50) {
  const paths = [
    "/users", "/users/:id", "/auth/login", "/auth/refresh", "/orders",
    "/orders/:id", "/payments/intent", "/payments/:id", "/products", "/products/:id",
    "/cart", "/cart/items", "/checkout", "/webhooks/stripe", "/webhooks/github",
    "/notifications", "/files/upload", "/files/:id", "/teams", "/teams/:id/members",
    "/posts", "/posts/:id", "/comments", "/comments/:id", "/likes",
  ];
  return Array.from({ length: count }, (_, i) => {
    const path = paths[i % paths.length];
    const method = METHODS[i % METHODS.length];
    return {
      id: nanoUid("mock"),
      name: `${method} ${path}`,
      method, path,
      status: [200, 201, 200, 200, 204, 400, 404][i % 7],
      delayMs: [0, 50, 100, 250, 500][i % 5],
      response: { success: true, message: `${method} ${path} response`, data: { id: i + 1, ref: nanoUid("ref") } },
      enabled: i % 5 !== 0,
    };
  });
}

function seedNotifications() {
  const tpl = [
    { type: "info", title: "Welcome to Noidr Web", desc: "Press ⌘K to open the command palette." },
    { type: "success", title: "Mock server started", desc: "Users API mock is now online." },
    { type: "success", title: "Test passed", desc: "GET /users returned 200 in 142ms." },
    { type: "warning", title: "Environment updated", desc: "Staging.TOKEN was changed." },
    { type: "info", title: "New collection", desc: "Payments API was created." },
    { type: "danger", title: "Test failed", desc: "POST /orders expected 201, got 500." },
    { type: "success", title: "Workspace switched", desc: "You're now in Frontstac." },
  ];
  return tpl.map((t, i) => ({ id: nanoUid("ntf"), ...t, read: i > 2, timestamp: Date.now() - i * 1200000 }));
}

export function buildInitialState() {
  const workspaces = seedWorkspaces();
  const activeWorkspaceId = workspaces[0].id;
  const collectionsMap = {};
  const environmentsMap = {};
  workspaces.forEach((ws, wsIdx) => {
    const sliceStart = (wsIdx * 3) % collectionSeeds.length;
    const subset = collectionSeeds.slice(sliceStart, sliceStart + 3);
    collectionsMap[ws.id] = subset.map((c, idx) => {
      const folders = c.folders.map((fname) => ({ id: nanoUid("fld"), name: fname, parentId: null }));
      return {
        id: nanoUid("col"),
        workspaceId: ws.id,
        name: c.name,
        description: `${c.name} endpoints`,
        folders,
        requests: buildRequestsForCollection(c, folders.map((f) => f.id)),
        archived: false,
        pinned: idx === 0,
        createdAt: Date.now() - (idx + 1) * 86400000,
      };
    });
    environmentsMap[ws.id] = seedEnvironments(ws.id);
  });

  const history = seedHistory(collectionsMap[activeWorkspaceId], 50);
  const team = seedTeam(20);
  const mockServers = seedMockServers(50);
  const notifications = seedNotifications();

  return { user: null, workspaces, activeWorkspaceId, collectionsMap, environmentsMap, history, team, mockServers, notifications };
}

export const METHODS_LIST = METHODS;
export const PROTOCOLS = [
  { id: "http", label: "HTTP" },
  { id: "websocket", label: "WebSocket" },
  { id: "sse", label: "SSE" },
  { id: "grpc", label: "gRPC" },
];
