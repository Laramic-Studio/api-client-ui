/**
 * @typedef {'low'|'medium'|'high'} AiRisk
 * @typedef {{ ok?: boolean, message: string }} AiActionResult
 * @typedef {{ navigate: (path: string) => void, route?: string }} AiActionContext
 */

/**
 * @typedef {Object} AiActionDefinition
 * @property {string} label
 * @property {string} [description]
 * @property {AiRisk} risk
 * @property {string} [payloadHint] - JSON-schema-ish hint for the LLM
 * @property {(payload: Record<string, unknown>) => void} [validate]
 * @property {(payload: Record<string, unknown>, ctx: AiActionContext) => AiActionResult|Promise<AiActionResult>} [execute]
 * @property {boolean} [requiresBinding] - execute provided by page at runtime
 */

/**
 * @typedef {Object} AiToolDefinition
 * @property {string} id
 * @property {'global'|'page'} scope
 * @property {string} [pageId] - required when scope === 'page'
 * @property {string} description
 * @property {() => Record<string, unknown>|null} [getSnapshot]
 * @property {Record<string, AiActionDefinition>} actions
 */

/** @param {AiActionDefinition} def */
export function defineAction(def) {
  return def;
}

/** @param {AiToolDefinition} def */
export function defineTool(def) {
  return def;
}

/** @param {Record<string, AiActionDefinition>} actions */
export function actionManifest(actions) {
  return Object.entries(actions).map(([type, def]) => ({
    type,
    label: def.label,
    description: def.description || null,
    risk: def.risk,
    payload: def.payloadHint || null,
  }));
}
