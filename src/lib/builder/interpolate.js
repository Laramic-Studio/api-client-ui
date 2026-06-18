import { isDynamicVariable, resolveDynamicVariable } from "@/lib/builder/dynamic-variables";

// [[VAR]], {{VAR}}, [[ $randomFirstName ]], {{$randomFirstName}}
const INTERPOLATION_RE = /\[\[\s*(\$?[A-Za-z0-9_]+)\s*\]\]|\{\{\s*(\$?[A-Za-z0-9_]+)\s*\}\}/g;

function readEnvValue(env, key, overlay) {
  if (overlay?.has?.(key)) return overlay.get(key);
  const row = env?.variables?.find((x) => x.enabled !== false && x.key === key);
  return row?.value;
}

export function interpolate(str, env, overlay = null) {
  if (str == null || str === "") return "";
  return String(str).replace(INTERPOLATION_RE, (_match, bracketKey, braceKey) => {
    const key = bracketKey || braceKey;
    if (isDynamicVariable(key)) return resolveDynamicVariable(key);
    const value = readEnvValue(env, key, overlay);
    if (value != null) return value;
    return bracketKey ? `[[${key}]]` : `{{${key}}}`;
  });
}

export function replaceInTemplate(template, env, overlay = null) {
  return interpolate(template, env, overlay);
}
