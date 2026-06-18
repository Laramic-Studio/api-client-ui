import {
  createNr,
  createResponseView,
  createScriptConsole,
  createVariableScope,
  runSandboxScript,
} from "@/lib/builder/script-sandbox";

function stripComments(script) {
  return script
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function fail(message) {
  throw new Error(message);
}

function createExpect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        fail(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      if (!deepEqual(actual, expected)) {
        fail(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected) {
      if (typeof actual === "string") {
        if (!actual.includes(String(expected))) {
          fail(`Expected string to contain ${JSON.stringify(expected)}`);
        }
        return;
      }
      if (Array.isArray(actual)) {
        if (!actual.some((item) => deepEqual(item, expected) || item === expected)) {
          fail(`Expected array to contain ${JSON.stringify(expected)}`);
        }
        return;
      }
      fail("toContain expects a string or array value.");
    },
    toMatch(pattern) {
      const re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern));
      if (typeof actual !== "string" || !re.test(actual)) {
        fail(`Expected ${JSON.stringify(actual)} to match ${re}`);
      }
    },
    toBeTruthy() {
      if (!actual) fail(`Expected truthy value, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) fail(`Expected falsy value, got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        fail(`Expected ${JSON.stringify(actual)} to be greater than ${JSON.stringify(expected)}`);
      }
    },
    toBeLessThan(expected) {
      if (!(actual < expected)) {
        fail(`Expected ${JSON.stringify(actual)} to be less than ${JSON.stringify(expected)}`);
      }
    },
  };
}

function runLineAssertions(script, responseView) {
  const lines = script.split("\n").map((l) => l.trim()).filter(Boolean);
  const results = [];

  lines.forEach((line, idx) => {
    try {
      // eslint-disable-next-line no-new-func
      new Function("response", "expect", line)(responseView, (actual) => createExpect(actual));
      results.push({ id: idx, name: line, passed: true, error: null });
    } catch (err) {
      results.push({
        id: idx,
        name: line,
        passed: false,
        error: err?.message || String(err),
      });
    }
  });

  return results;
}

function runFullPostScript(script, response, env, { onEnvSet } = {}) {
  const logs = [];
  const tests = [];
  const variables = createVariableScope(env, { onSet: onEnvSet });
  const responseView = createResponseView(response);
  const console = createScriptConsole((entry) => logs.push({ phase: "post", ...entry }));
  const nr = createNr({
    variables,
    request: null,
    response: responseView,
    onTest: (entry) => tests.push(entry),
  });

  const test = (name, fn) => tests.push({ name, fn });

  try {
    runSandboxScript(script, {
      nr,
      variables,
      request: null,
      response: responseView,
      console,
      expect: (actual) => createExpect(actual),
      test,
    });
  } catch (err) {
    return {
      results: [{
        id: 0,
        name: "Post-response script",
        passed: false,
        error: err?.message || String(err),
      }],
      logs,
      env: variables.toEnv(env),
    };
  }

  if (tests.length > 0) {
    const results = tests.map((entry, idx) => {
      try {
        entry.fn();
        return { id: idx, name: entry.name, passed: true, error: null };
      } catch (err) {
        return {
          id: idx,
          name: entry.name,
          passed: false,
          error: err?.message || String(err),
        };
      }
    });
    return { results, logs, env: variables.toEnv(env) };
  }

  return {
    results: [{ id: 0, name: "Post-response script", passed: true, error: null }],
    logs,
    env: variables.toEnv(env),
  };
}

function looksLikeFullScript(script) {
  return /\b(console\.|response\.|variables\.|nr\.|varibles\.|if\s*\(|for\s*\(|while\s*\(|const\s+|let\s+|var\s+)/.test(script);
}

export function runTests(testScript, response, env = null, options = {}) {
  if (!testScript || !testScript.trim()) return { results: [], logs: [], env };

  const script = stripComments(testScript).trim();
  if (!script) return { results: [], logs: [], env };

  if (/\b(nr\.)?test\s*\(/.test(script) || looksLikeFullScript(script)) {
    return runFullPostScript(script, response, env, options);
  }

  const responseView = createResponseView(response);
  return {
    results: runLineAssertions(script, responseView),
    logs: [],
    env,
  };
}

export function runTestsAgainstLastResponse(testScript, response, env = null, options = {}) {
  if (!response) {
    return {
      results: [{
        id: 0,
        name: "Run tests",
        passed: false,
        error: "Send a request first to run tests against its response.",
      }],
      logs: [],
      env,
    };
  }
  return runTests(testScript, response, env, options);
}
