import { resolveAiPageId } from "@/lib/ai/pages";
import { actionManifest } from "@/ai-tools/types";

/** @typedef {import('@/ai-tools/types').AiToolDefinition} AiToolDefinition */
/** @typedef {import('@/ai-tools/types').AiActionContext} AiActionContext */

/**
 * Central registry for AI tools and actions.
 * - Global tools are always executable when they define `execute`.
 * - Page tools appear in the manifest everywhere; `ready` reflects live bindings.
 * - Low-risk actions can be auto-run by the chat layer after the model proposes them.
 */
class AiToolRegistry {
  /** @type {Map<string, AiToolDefinition>} */
  #tools = new Map();

  /** @type {Map<string, { type: string, toolId: string, def: import('@/ai-tools/types').AiActionDefinition, scope: string, pageId?: string }>} */
  #actions = new Map();

  /** @type {Map<string, { getSnapshot?: () => Record<string, unknown>|null, getBinding?: (type: string) => Function|null }>} */
  #pageBindings = new Map();

  /** @param {AiToolDefinition} tool */
  registerTool(tool) {
    if (this.#tools.has(tool.id)) {
      console.warn(`[ai-tools] tool "${tool.id}" already registered — skipping`);
      return;
    }
    this.#tools.set(tool.id, tool);
    for (const [type, def] of Object.entries(tool.actions)) {
      if (this.#actions.has(type)) {
        throw new Error(`[ai-tools] duplicate action type "${type}"`);
      }
      this.#actions.set(type, {
        type,
        toolId: tool.id,
        def,
        scope: tool.scope,
        pageId: tool.pageId,
      });
    }
  }

  /**
   * @param {string} pageId
   * @param {{ getSnapshot?: () => Record<string, unknown>|null, getBinding?: (type: string) => Function|null }} config
   */
  bindPage(pageId, config) {
    this.#pageBindings.set(pageId, config);
    return () => {
      if (this.#pageBindings.get(pageId) === config) {
        this.#pageBindings.delete(pageId);
      }
    };
  }

  /** @param {string} route */
  resolvePageId(route) {
    return resolveAiPageId(route);
  }

  /**
   * Full manifest — every registered action, with readiness for the current route.
   * @param {string} route
   */
  getManifest(route) {
    const currentPageId = resolveAiPageId(route);
    /** @type {Array<Record<string, unknown>>} */
    const manifest = [];

    for (const tool of this.#tools.values()) {
      for (const entry of actionManifest(tool.actions)) {
        const registered = this.#actions.get(entry.type);
        if (!registered) continue;

        const ready = this.#isReady(registered, currentPageId);
        manifest.push({
          ...entry,
          tool: tool.id,
          scope: registered.scope,
          pageId: registered.pageId || null,
          ready,
          autoRun: ready && entry.risk === "low",
        });
      }
    }

    return manifest;
  }

  /** @param {string} route */
  getPageSnapshot(route) {
    const pageId = resolveAiPageId(route);
    if (!pageId) return null;
    return this.#pageBindings.get(pageId)?.getSnapshot?.() ?? null;
  }

  /** @param {string} route */
  getGlobalSnapshots(route) {
    /** @type {Record<string, unknown>} */
    const snapshots = {};
    for (const tool of this.#tools.values()) {
      if (tool.scope !== "global" || !tool.getSnapshot) continue;
      snapshots[tool.id] = tool.getSnapshot(route);
    }
    return snapshots;
  }

  /** @param {string} type @param {string} route */
  canExecute(type, route) {
    const entry = this.#actions.get(type);
    if (!entry) return false;
    return this.#isReady(entry, resolveAiPageId(route));
  }

  /** @param {string} type @param {string} route */
  isAllowed(type, route) {
    return this.canExecute(type, route);
  }

  /**
   * @param {string} type
   * @param {Record<string, unknown>} payload
   * @param {AiActionContext} ctx
   */
  async execute(type, payload, ctx) {
    const route = ctx.route || "/";
    const currentPageId = resolveAiPageId(route);
    const entry = this.#actions.get(type);

    if (!entry) throw new Error(`Unknown action "${type}".`);
    if (!this.#isReady(entry, currentPageId)) {
      const hint = entry.scope === "page" && entry.pageId
        ? ` Open the ${entry.pageId} page first, or use a catalog/global action.`
        : "";
      throw new Error(`Action "${type}" is not ready.${hint}`);
    }

    entry.def.validate?.(payload);

    if (entry.scope === "page" && entry.pageId) {
      const binding = this.#pageBindings.get(entry.pageId)?.getBinding?.(type);
      if (binding) return binding(payload, ctx);
    }

    if (entry.def.execute) {
      return entry.def.execute(payload, ctx);
    }

    throw new Error(`Action "${type}" has no executor.`);
  }

  /** @param {string} type */
  getAction(type) {
    return this.#actions.get(type)?.def ?? null;
  }

  listActionTypes() {
    return [...this.#actions.keys()];
  }

  #isReady(entry, currentPageId) {
    if (entry.scope === "global") {
      return Boolean(entry.def.execute) || !entry.def.requiresBinding;
    }

    if (entry.def.requiresBinding) {
      return Boolean(
        entry.pageId
        && this.#pageBindings.get(entry.pageId)?.getBinding?.(entry.type),
      );
    }

    return entry.pageId === currentPageId && Boolean(entry.def.execute);
  }
}

export const aiToolRegistry = new AiToolRegistry();
