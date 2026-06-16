// Centralized data-testid registry. Always reference these in components.
export const HOME = {
  emergentLink: "home-emergent-link",
};

export const AUTH = {
  loginEmail: "login-email-input",
  loginPassword: "login-password-input",
  loginRemember: "login-remember-checkbox",
  loginSubmit: "login-submit-button",
  loginForgot: "login-forgot-link",
  loginToRegister: "login-to-register-link",
  registerName: "register-name-input",
  registerEmail: "register-email-input",
  registerPassword: "register-password-input",
  registerSubmit: "register-submit-button",
  registerToLogin: "register-to-login-link",
  forgotEmail: "forgot-email-input",
  forgotSubmit: "forgot-submit-button",
  verifyOtp: "verify-otp-input",
  verifySubmit: "verify-submit-button",
  verifyResend: "verify-resend-button",
  resetPassword: "reset-password-input",
  resetSubmit: "reset-submit-button",
  logout: "logout-button",
};

export const NAV = {
  item: (key) => `nav-item-${key}`,
  collapseToggle: "sidebar-collapse-toggle",
  workspaceSwitcher: "workspace-switcher",
  search: "sidebar-search-input",
  themeToggle: "theme-toggle",
  notifications: "notifications-button",
  commandKBtn: "command-palette-trigger",
};

export const CMD = {
  dialog: "command-palette-dialog",
  input: "command-palette-input",
  item: (key) => `cmd-item-${key}`,
};

export const BUILDER = {
  methodSelect: "builder-method-select",
  urlInput: "builder-url-input",
  sendButton: "builder-send-button",
  saveButton: "builder-save-button",
  tab: (key) => `builder-tab-${key}`,
  bodyTypeSelect: "builder-body-type-select",
  paramAdd: "builder-param-add",
  headerAdd: "builder-header-add",
  responseStatus: "response-status",
  responseTime: "response-time",
  responseSize: "response-size",
  responseTab: (key) => `response-tab-${key}`,
};

export const COLL = {
  newCollection: "collections-new-button",
  newRequest: "collections-new-request",
  item: (id) => `collection-item-${id}`,
  request: (id) => `request-item-${id}`,
};

export const ENV = {
  newEnv: "env-new-button",
  envItem: (id) => `env-item-${id}`,
  varAdd: "env-var-add",
  varSecret: (index) => `env-var-secret-${index}`,
};

export const MOCK = {
  newEndpoint: "mock-new-endpoint",
  item: (id) => `mock-item-${id}`,
};

export const DASH = {
  stat: (key) => `dash-stat-${key}`,
};
