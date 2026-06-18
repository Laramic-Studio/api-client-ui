const handlers = new Map();

export function registerAiAction(type, handler) {
  handlers.set(type, handler);
}

export function getAiAction(type) {
  return handlers.get(type) || null;
}

export function listAiActionTypes() {
  return [...handlers.keys()];
}

registerAiAction("nav.go", {
  label: "Navigate",
  risk: "low",
  validate(payload) {
    if (!payload?.path || typeof payload.path !== "string") {
      throw new Error("Missing navigation path.");
    }
  },
  async execute(payload, { navigate }) {
    navigate(payload.path);
    return { ok: true, message: `Navigated to ${payload.path}` };
  },
});
