import { substituteConduitVars } from "@/lib/conduits/variables";

function upsertRow(rows, key, value) {
  const list = [...(rows || [])];
  const idx = list.findIndex((r) => r.key === key);
  const row = { key, value, enabled: true };
  if (idx >= 0) list[idx] = { ...list[idx], ...row };
  else list.push(row);
  return list;
}

function formatTemplate(template, value) {
  return (template || "{{value}}").replace(/\{\{value\}\}/g, String(value ?? ""));
}

/** Apply extraction passes onto a step config before it runs. */
export function applyPassesToStep(step, passes, flowVars) {
  if (!passes?.length) return step;
  const next = {
    ...step,
    headers: [...(step.headers || [])],
    params: [...(step.params || [])],
    body: step.body ? { ...step.body } : { type: "none", content: "" },
    auth: step.auth ? { ...step.auth } : { type: "none" },
  };

  passes.forEach((pass) => {
    const raw = flowVars[pass.variable];
    if (raw === undefined || raw === null) return;
    const formatted = formatTemplate(pass.template, raw);

    if (pass.target === "header") {
      next.headers = upsertRow(next.headers, pass.key, formatted);
    } else if (pass.target === "param") {
      next.params = upsertRow(next.params, pass.key, formatted);
    } else if (pass.target === "auth_bearer") {
      next.auth = { type: "bearer", token: formatted };
    } else if (pass.target === "body") {
      next.body = {
        ...next.body,
        type: next.body.type === "none" ? "json" : next.body.type,
        content: formatted,
      };
    }
  });

  return next;
}

/** Collect passes from step extractions to apply on the next step. */
export function collectPendingPasses(extractions) {
  const pending = [];
  (extractions || []).forEach((ext) => {
    const variable = ext.variable || ext.path?.replace(/\./g, "_");
    (ext.passes || []).forEach((pass) => {
      pending.push({ ...pass, variable });
    });
  });
  return pending;
}

export function applyVarSubstitutions(step, env, flowVars, interpolate) {
  const sub = (str) => substituteConduitVars(interpolate(str || "", env), flowVars);

  return {
    ...step,
    url: sub(step.url),
    params: (step.params || []).map((p) => ({ ...p, value: sub(p.value) })),
    headers: (step.headers || []).map((h) => ({ ...h, value: sub(h.value) })),
    body: step.body?.content
      ? { ...step.body, content: sub(step.body.content) }
      : step.body,
    auth:
      step.auth?.type === "bearer"
        ? { ...step.auth, token: sub(step.auth.token) }
        : step.auth?.type === "apikey"
          ? { ...step.auth, value: sub(step.auth.value) }
          : step.auth,
  };
}
