import { extractByPath } from "@/lib/conduits/variables";

export function evaluateCondition(condition, { previousResponse, flowVars }) {
  if (!condition || condition.type === "none" || condition.enabled === false) {
    return true;
  }

  const prevStatus = previousResponse?.status ?? 0;
  const prevBody = previousResponse?.body;

  switch (condition.type) {
    case "status_equals":
      return prevStatus === Number(condition.value);
    case "status_is_2xx":
      return prevStatus >= 200 && prevStatus < 300;
    case "body_path_equals": {
      const actual = extractByPath(prevBody, condition.path || "");
      return String(actual) === String(condition.value ?? "");
    }
    case "body_path_exists":
      return extractByPath(prevBody, condition.path || "") !== undefined;
    case "variable_equals": {
      const actual = flowVars[condition.variable || ""];
      return String(actual) === String(condition.value ?? "");
    }
    default:
      return true;
  }
}
