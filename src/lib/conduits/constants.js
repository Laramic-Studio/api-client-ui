export const PASS_TARGETS = [
  { id: "header", label: "Header" },
  { id: "param", label: "Query param" },
  { id: "auth_bearer", label: "Auth — Bearer token" },
  { id: "body", label: "Body (replace content)" },
];

export const CONDITION_TYPES = [
  { id: "none", label: "No condition" },
  { id: "status_equals", label: "Previous status equals" },
  { id: "status_is_2xx", label: "Previous status is 2xx" },
  { id: "body_path_equals", label: "Previous body field equals" },
  { id: "body_path_exists", label: "Previous body field exists" },
  { id: "variable_equals", label: "Flow variable equals" },
];

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
