export function emptyTestResults() {
  return {
    pre: { status: "skipped", results: [], logs: [] },
    post: { status: "skipped", results: [], logs: [] },
    console: [],
  };
}

export function preScriptPassed(logs = []) {
  return {
    pre: {
      status: "passed",
      results: [{ id: "pre-0", name: "Pre-request script", passed: true, error: null }],
      logs,
    },
    post: { status: "skipped", results: [], logs: [] },
    console: logs,
  };
}

export function preScriptFailed(error, logs = []) {
  return {
    pre: {
      status: "failed",
      results: [{
        id: "pre-0",
        name: "Pre-request script",
        passed: false,
        error: error || "Pre-request script failed.",
      }],
      logs,
    },
    post: { status: "skipped", results: [], logs: [] },
    console: logs,
  };
}

export function withPostResults(base, postResults, postLogs = []) {
  const results = postResults?.results ?? postResults ?? [];
  const logs = postResults?.logs ?? postLogs ?? [];
  const hasScript = results.length > 0;
  const consoleLogs = [...(base.console || []), ...logs];

  return {
    ...base,
    post: {
      status: hasScript
        ? (results.every((r) => r.passed) ? "passed" : "failed")
        : "skipped",
      results,
      logs,
    },
    console: consoleLogs,
  };
}

export function summarizeTestResults(testResults) {
  if (!testResults) {
    return { passed: 0, failed: 0, total: 0, hasActivity: false };
  }

  const all = [...(testResults.pre?.results || []), ...(testResults.post?.results || [])];
  const passed = all.filter((r) => r.passed).length;
  const failed = all.filter((r) => !r.passed).length;
  const hasActivity = testResults.pre?.status !== "skipped" || testResults.post?.status !== "skipped";

  return { passed, failed, total: all.length, hasActivity };
}

export function testsTabLabel(testResults) {
  const summary = summarizeTestResults(testResults);
  if (!summary.hasActivity) return "Tests";
  if (summary.failed > 0) return `Tests (${summary.failed} failed)`;
  if (summary.passed > 0) return `Tests (${summary.passed} passed)`;
  return "Tests";
}

export function consoleTabLabel(testResults) {
  const count = testResults?.console?.length || 0;
  return count > 0 ? `Console (${count})` : "Console";
}

export function normalizeTestResults(value) {
  if (!value) return emptyTestResults();
  if (Array.isArray(value)) {
    return withPostResults(emptyTestResults(), value);
  }
  if (value.pre || value.post) {
    const pre = value.pre || { status: "skipped", results: [], logs: [] };
    const post = value.post || { status: "skipped", results: [], logs: [] };
    return {
      pre: { ...pre, logs: pre.logs || [] },
      post: { ...post, logs: post.logs || [] },
      console: value.console || [...(pre.logs || []), ...(post.logs || [])],
    };
  }
  return emptyTestResults();
}
