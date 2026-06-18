function upsertHeaderRow(headers, key, value) {
  const normalized = String(key);
  const idx = headers.findIndex(
    (h) => h.key && h.key.toLowerCase() === normalized.toLowerCase(),
  );
  const row = { key: normalized, value: String(value ?? ""), enabled: true };
  if (idx >= 0) headers[idx] = { ...headers[idx], ...row };
  else headers.push(row);
}

function getHeaderValue(headers, key) {
  const row = headers.find(
    (h) => h.enabled !== false && h.key?.toLowerCase() === String(key).toLowerCase(),
  );
  return row?.value;
}

export function createVariableScope(env, { onSet } = {}) {
  const overlay = new Map();

  const readFromEnv = (key) => {
    const row = (env?.variables || []).find(
      (v) => v.enabled !== false && v.key === key,
    );
    return row?.value;
  };

  const scope = {
    get(key) {
      if (overlay.has(key)) return overlay.get(key);
      return readFromEnv(key);
    },
    set(key, value) {
      const normalized = String(key);
      overlay.set(normalized, String(value ?? ""));
      onSet?.(normalized, String(value ?? ""));
      return scope;
    },
    unset(key) {
      overlay.delete(String(key));
      return scope;
    },
    has(key) {
      return overlay.has(key) || readFromEnv(key) !== undefined;
    },
    toEnv(baseEnv) {
      if (!baseEnv) return baseEnv;
      const variables = [...(baseEnv.variables || [])];
      overlay.forEach((value, key) => {
        const idx = variables.findIndex((v) => v.key === key);
        if (idx >= 0) variables[idx] = { ...variables[idx], value };
        else variables.push({ key, value, enabled: true });
      });
      return { ...baseEnv, variables };
    },
    getOverlay() {
      return overlay;
    },
  };

  return scope;
}

export function createRequestView(request) {
  const view = {
    get method() {
      return request.method;
    },
    set method(value) {
      request.method = value;
    },
    get url() {
      return request.url;
    },
    set url(value) {
      request.url = value;
    },
    headers: {},
  };

  view.headers = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "get") {
          return (key) => getHeaderValue(request.headers, key);
        }
        if (prop === "set" || prop === "add" || prop === "upsert") {
          return (key, value) => {
            const headerKey = typeof key === "object" ? key.key : key;
            const headerValue = typeof key === "object" ? key.value : value;
            upsertHeaderRow(request.headers, headerKey, headerValue);
          };
        }
        if (typeof prop === "symbol") return undefined;
        return getHeaderValue(request.headers, prop);
      },
      set(_target, prop, value) {
        if (typeof prop === "symbol") return false;
        upsertHeaderRow(request.headers, prop, value);
        return true;
      },
    },
  );

  return view;
}

export function createResponseView(response) {
  return {
    status: response?.status ?? 0,
    code: response?.status ?? 0,
    statusText: response?.statusText ?? "",
    ok: Boolean(response?.ok),
    headers: response?.headers || {},
    body: response?.body,
    json() {
      if (response?.body != null && typeof response.body === "object") {
        return response.body;
      }
      const text = response?.rawText ?? "";
      if (!text.trim()) return null;
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Response body is not valid JSON.");
      }
    },
    text() {
      if (response?.rawText != null) return response.rawText;
      if (response?.body == null) return "";
      return typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.body);
    },
  };
}

export function createScriptConsole(onLog) {
  const formatArgs = (args) => args.map((arg) => {
    if (typeof arg === "string") return arg;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(" ");

  const logFn = (level) => (...args) => {
    onLog?.({ level, message: formatArgs(args) });
  };

  return {
    log: logFn("log"),
    info: logFn("info"),
    warn: logFn("warn"),
    error: logFn("error"),
    debug: logFn("debug"),
  };
}

export function createPm({ variables, request, response, onTest }) {
  const pm = {
    variables,
    environment: variables,
    collectionVariables: variables,
    globals: variables,
    request,
    response,
    test(name, fn) {
      onTest?.({ name, fn });
    },
  };
  return pm;
}

export function runSandboxScript(script, context) {
  const {
    pm,
    variables,
    request,
    response,
    console,
    expect,
    test,
  } = context;

  // eslint-disable-next-line no-new-func
  const runner = new Function(
    "pm",
    "variables",
    "varibles",
    "request",
    "response",
    "console",
    "expect",
    "test",
    script,
  );

  runner(pm, variables, variables, request, response, console, expect, test);
}
