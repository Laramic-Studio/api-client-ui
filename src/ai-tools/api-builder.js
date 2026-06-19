import { defineAction, defineTool } from "@/ai-tools/types";

const REQUEST_PANEL_TABS = new Set([
  "params",
  "authorization",
  "headers",
  "body",
  "scripts",
  "tests",
  "docs",
]);

const BODY_TYPES = new Set(["none", "json", "xml", "raw", "form"]);
const RESPONSE_LAYOUTS = new Set(["side", "bottom"]);

function boundAction(label, description, risk, payloadHint, validate, extra = {}) {
  return defineAction({
    label,
    description,
    risk,
    requiresBinding: true,
    payloadHint,
    validate,
    ...extra,
  });
}

function requireTab(payload) {
  if (payload?.tab && !REQUEST_PANEL_TABS.has(payload.tab)) {
    throw new Error(`tab must be one of: ${[...REQUEST_PANEL_TABS].join(", ")}`);
  }
}

export const apiBuilderTool = defineTool({
  id: "api-builder",
  scope: "page",
  pageId: "api-builder",
  description:
    "API Builder — tabs, request editor, send/save, response panel, console, collections explorer, examples",
  actions: {
    // ── Draft & send ──────────────────────────────────────────────────────────
    "builder.apply_draft": boundAction(
      "Apply to request",
      "Merge a full or partial spec into the open draft — method, url, params, headers, auth, body, preScript, tests, docs (local only, does not save)",
      "low",
      '{"spec":{"name":"Create user","method":"POST","url":"https://api.example.com/users","params":[{"key":"dry_run","value":"true","enabled":true}],"headers":[{"key":"Content-Type","value":"application/json","enabled":true}],"auth":{"type":"bearer","token":"[[TOKEN]]"},"body":{"type":"json","content":"{\\"name\\":\\"Jane\\"}"},"preScript":"","tests":"nr.test(\'Created\', response.status === 201);","docs":"## Create user\\nCreates a new user account."}}',
      (payload) => {
        if (!payload?.spec || typeof payload.spec !== "object") {
          throw new Error("Missing spec object in payload.");
        }
      },
    ),
    "builder.discard_draft": boundAction(
      "Discard draft changes",
      "Revert the open tab to the last saved version",
      "medium",
      "{}",
    ),
    "builder.save_request": boundAction(
      "Save request",
      "Persist the open request to its collection (creates collection if needed)",
      "medium",
      "{}",
    ),
    "builder.send_request": boundAction(
      "Send request",
      "Execute the open request via browser or proxy",
      "low",
      "{}",
    ),
    "builder.send_request_via_cloud": boundAction(
      "Send via cloud",
      "Retry/send through the cloud proxy (use when CORS blocks the browser)",
      "low",
      "{}",
    ),

    // ── Tabs ──────────────────────────────────────────────────────────────────
    "builder.new_scratch_tab": boundAction(
      "New request tab",
      "Open a blank scratch request tab",
      "low",
      "{}",
    ),
    "builder.select_tab": boundAction(
      "Select tab",
      "Switch to an open builder tab by id",
      "low",
      '{"tab_id":"<uuid or scratch-*>"}',
      (payload) => {
        if (!payload?.tab_id) throw new Error("tab_id is required.");
      },
    ),
    "builder.close_tab": boundAction(
      "Close tab",
      "Close a tab; prompts if unsaved unless force is set",
      "medium",
      '{"tab_id":"<uuid>","force":"discard|save"}',
      (payload) => {
        if (!payload?.tab_id) throw new Error("tab_id is required.");
        if (payload.force && !["discard", "save"].includes(payload.force)) {
          throw new Error('force must be "discard" or "save".');
        }
      },
    ),
    "builder.reorder_tabs": boundAction(
      "Reorder tabs",
      "Move a tab before another in the tab bar",
      "low",
      '{"from_tab_id":"<uuid>","to_tab_id":"<uuid>"}',
      (payload) => {
        if (!payload?.from_tab_id || !payload?.to_tab_id) {
          throw new Error("from_tab_id and to_tab_id are required.");
        }
      },
    ),

    // ── Request fields (open draft) ─────────────────────────────────────────
    "builder.set_name": boundAction(
      "Set request name",
      "Rename the open request draft",
      "low",
      '{"name":"Get users"}',
      (payload) => {
        if (!payload?.name?.trim()) throw new Error("name is required.");
      },
    ),
    "builder.set_method": boundAction(
      "Set HTTP method",
      "Change method on the open request",
      "low",
      '{"method":"GET"}',
      (payload) => {
        if (!payload?.method) throw new Error("method is required.");
      },
    ),
    "builder.set_url": boundAction(
      "Set URL",
      "Set the request URL (supports [[VAR]] env syntax)",
      "low",
      '{"url":"[[BASE_URL]]/users"}',
      (payload) => {
        if (payload?.url == null) throw new Error("url is required.");
      },
    ),
    "builder.set_params": boundAction(
      "Set query params",
      "Replace all query params on the open request",
      "low",
      '{"params":[{"key":"page","value":"1","enabled":true}]}',
      (payload) => {
        if (!Array.isArray(payload?.params)) throw new Error("params array is required.");
      },
    ),
    "builder.add_param": boundAction(
      "Add query param",
      "Append a query param row",
      "low",
      '{"key":"q","value":"search","enabled":true}',
      (payload) => {
        if (!payload?.key) throw new Error("key is required.");
      },
    ),
    "builder.update_param": boundAction(
      "Update query param",
      "Patch a param by index or key",
      "low",
      '{"index":0,"patch":{"value":"2"}} | {"key":"page","patch":{"enabled":false}}',
    ),
    "builder.remove_param": boundAction(
      "Remove query param",
      "Remove a param by index or key",
      "low",
      '{"index":0} | {"key":"page"}',
      (payload) => {
        if (payload?.index == null && !payload?.key) {
          throw new Error("index or key is required.");
        }
      },
    ),
    "builder.set_headers": boundAction(
      "Set headers",
      "Replace all headers on the open request",
      "low",
      '{"headers":[{"key":"Accept","value":"application/json","enabled":true}]}',
      (payload) => {
        if (!Array.isArray(payload?.headers)) throw new Error("headers array is required.");
      },
    ),
    "builder.add_header": boundAction(
      "Add header",
      "Append a header row",
      "low",
      '{"key":"Authorization","value":"Bearer [[TOKEN]]","enabled":true}',
      (payload) => {
        if (!payload?.key) throw new Error("key is required.");
      },
    ),
    "builder.update_header": boundAction(
      "Update header",
      "Patch a header by index or key",
      "low",
      '{"index":0,"patch":{"value":"application/json"}} | {"key":"Accept","patch":{"enabled":false}}',
    ),
    "builder.remove_header": boundAction(
      "Remove header",
      "Remove a header by index or key",
      "low",
      '{"index":0} | {"key":"Accept"}',
      (payload) => {
        if (payload?.index == null && !payload?.key) {
          throw new Error("index or key is required.");
        }
      },
    ),
    "builder.set_auth": boundAction(
      "Set authorization",
      "Configure auth on the open request (none, bearer, basic, apikey, oauth2)",
      "low",
      '{"auth":{"type":"bearer","token":"[[TOKEN]]"}}',
      (payload) => {
        if (!payload?.auth || typeof payload.auth !== "object") {
          throw new Error("auth object is required.");
        }
      },
    ),
    "builder.set_body_type": boundAction(
      "Set body type",
      "Change body type: none, json, xml, raw, form",
      "low",
      '{"type":"json"}',
      (payload) => {
        if (!BODY_TYPES.has(payload?.type)) {
          throw new Error(`type must be one of: ${[...BODY_TYPES].join(", ")}`);
        }
      },
    ),
    "builder.set_body_content": boundAction(
      "Set body content",
      "Set raw/json/xml body text",
      "low",
      '{"content":"{\\"id\\":1}"}',
      (payload) => {
        if (payload?.content == null) throw new Error("content is required.");
      },
    ),
    "builder.set_body_form_rows": boundAction(
      "Set form body rows",
      "Replace form-data fields when body type is form",
      "low",
      '{"formRows":[{"key":"file","value":"x","enabled":true}]}',
      (payload) => {
        if (!Array.isArray(payload?.formRows)) throw new Error("formRows array is required.");
      },
    ),
    "builder.set_pre_script": boundAction(
      "Set pre-request script",
      "Replace the pre-request JavaScript on the open tab",
      "low",
      '{"preScript":"nr.variables.set(\'x\', 1);"}',
      (payload) => {
        if (payload?.preScript == null) throw new Error("preScript is required.");
      },
    ),
    "builder.set_tests": boundAction(
      "Set post-response tests",
      "Replace the tests script on the open tab",
      "low",
      '{"tests":"nr.test(\'ok\', response.status === 200);"}',
      (payload) => {
        if (payload?.tests == null) throw new Error("tests is required.");
      },
    ),
    "builder.set_docs": boundAction(
      "Set request docs",
      "Replace markdown/HTML docs for the open request",
      "low",
      '{"docs":"## Overview\\n..."}',
      (payload) => {
        if (payload?.docs == null) throw new Error("docs is required.");
      },
    ),
    "builder.set_request_tab": boundAction(
      "Focus request editor tab",
      "Switch Params / Authorization / Headers / Body / Pre-request / Tests / Docs panel",
      "low",
      '{"tab":"params|authorization|headers|body|scripts|tests|docs"}',
      (payload) => {
        requireTab(payload);
        if (!payload?.tab) throw new Error("tab is required.");
      },
    ),
    "builder.ask_ai": boundAction(
      "Ask AI to build request",
      "Open the AI assistant with an optional pre-filled prompt about the open request",
      "low",
      '{"prompt":"Build a GET request that lists users"}',
    ),

    // ── Environment (builder env picker) ──────────────────────────────────────
    "builder.set_environment": boundAction(
      "Set active environment",
      "Switch the env picker for the open request's collection",
      "low",
      '{"environment_id":"<uuid>"}',
      (payload) => {
        if (!payload?.environment_id) throw new Error("environment_id is required.");
      },
    ),
    "builder.update_env_variable": boundAction(
      "Update env variable",
      "Set one variable on the currently active environment",
      "low",
      '{"key":"TOKEN","value":"abc123"}',
      (payload) => {
        if (!payload?.key) throw new Error("key is required.");
        if (payload?.value == null) throw new Error("value is required.");
      },
    ),

    // ── Response panel ────────────────────────────────────────────────────────
    "builder.open_response_panel": boundAction(
      "Open response panel",
      "Show the response side/bottom panel",
      "low",
      "{}",
    ),
    "builder.close_response_panel": boundAction(
      "Close response panel",
      "Hide the response panel",
      "low",
      "{}",
    ),
    "builder.set_response_layout": boundAction(
      "Set response layout",
      "Position response as side sidebar or bottom stack",
      "low",
      '{"layout":"side|bottom"}',
      (payload) => {
        if (!RESPONSE_LAYOUTS.has(payload?.layout)) {
          throw new Error('layout must be "side" or "bottom".');
        }
      },
    ),
    "builder.clear_response": boundAction(
      "Clear response",
      "Clear cached response and test results for the open tab",
      "low",
      "{}",
    ),
    "builder.explain_response": boundAction(
      "Explain response",
      "Queue the AI assistant with the last response for explanation",
      "low",
      "{}",
    ),
    "builder.save_response_as_example": boundAction(
      "Save response as example",
      "Save the last real response as a named example on the saved request",
      "medium",
      '{"name":"200 OK"}',
    ),

    // ── Examples ──────────────────────────────────────────────────────────────
    "builder.open_example": boundAction(
      "Open saved example",
      "Open a request and preview a saved example response",
      "low",
      '{"request_id":"<uuid>","example_id":"<uuid>"}',
      (payload) => {
        if (!payload?.request_id || !payload?.example_id) {
          throw new Error("request_id and example_id are required.");
        }
      },
    ),
    "builder.add_example": boundAction(
      "Add example",
      "Attach a saved example response to a request",
      "medium",
      '{"request_id":"<uuid>","example":{"name":"200 OK","status":200,"statusText":"OK","headers":{},"body":{},"url":"","method":"GET"}}',
      (payload) => {
        if (!payload?.request_id) throw new Error("request_id is required.");
        if (!payload?.example || typeof payload.example !== "object") {
          throw new Error("example object is required.");
        }
      },
    ),
    "builder.delete_example": boundAction(
      "Delete example",
      "Remove a saved example from a request",
      "medium",
      '{"request_id":"<uuid>","example_id":"<uuid>"}',
      (payload) => {
        if (!payload?.request_id || !payload?.example_id) {
          throw new Error("request_id and example_id are required.");
        }
      },
    ),
    "builder.rename_example": boundAction(
      "Rename example",
      "Rename a saved example",
      "low",
      '{"request_id":"<uuid>","example_id":"<uuid>","name":"New name"}',
      (payload) => {
        if (!payload?.request_id || !payload?.example_id || !payload?.name?.trim()) {
          throw new Error("request_id, example_id, and name are required.");
        }
      },
    ),
    "builder.set_default_example": boundAction(
      "Set default example",
      "Mark one example as the default for a request",
      "low",
      '{"request_id":"<uuid>","example_id":"<uuid>"}',
      (payload) => {
        if (!payload?.request_id || !payload?.example_id) {
          throw new Error("request_id and example_id are required.");
        }
      },
    ),

    // ── Builder console ───────────────────────────────────────────────────────
    "builder.toggle_console": boundAction(
      "Toggle console",
      "Show or hide the bottom builder console",
      "low",
      "{}",
    ),
    "builder.open_console": boundAction(
      "Open console",
      "Show the bottom builder console panel",
      "low",
      "{}",
    ),
    "builder.close_console": boundAction(
      "Close console",
      "Hide the bottom builder console panel",
      "low",
      "{}",
    ),
    "builder.clear_console": boundAction(
      "Clear console",
      "Clear all console log entries",
      "low",
      "{}",
    ),

    // ── Collections explorer (from builder sidebar) ───────────────────────────
    "builder.create_collection": boundAction(
      "Create collection",
      "Create a new collection in the explorer",
      "medium",
      '{"name":"My Collection"}',
      (payload) => {
        if (!payload?.name?.trim()) throw new Error("name is required.");
      },
    ),
    "builder.delete_collection": boundAction(
      "Delete collection",
      "Permanently delete a collection and all its requests",
      "high",
      '{"collection_id":"<uuid>"}',
      (payload) => {
        if (!payload?.collection_id) throw new Error("collection_id is required.");
      },
    ),
    "builder.duplicate_collection": boundAction(
      "Duplicate collection",
      "Clone a collection with all requests",
      "medium",
      '{"collection_id":"<uuid>"}',
      (payload) => {
        if (!payload?.collection_id) throw new Error("collection_id is required.");
      },
    ),
    "builder.create_folder": boundAction(
      "Create folder",
      "Add a folder inside a collection",
      "medium",
      '{"collection_id":"<uuid>","name":"Folder","parent_id":null}',
      (payload) => {
        if (!payload?.collection_id || !payload?.name?.trim()) {
          throw new Error("collection_id and name are required.");
        }
      },
    ),
    "builder.rename_folder": boundAction(
      "Rename folder",
      "Rename a folder in a collection",
      "low",
      '{"collection_id":"<uuid>","folder_id":"<uuid>","name":"New name"}',
      (payload) => {
        if (!payload?.collection_id || !payload?.folder_id || !payload?.name?.trim()) {
          throw new Error("collection_id, folder_id, and name are required.");
        }
      },
    ),
    "builder.delete_folder": boundAction(
      "Delete folder",
      "Delete a folder; requests move to collection root",
      "high",
      '{"collection_id":"<uuid>","folder_id":"<uuid>"}',
      (payload) => {
        if (!payload?.collection_id || !payload?.folder_id) {
          throw new Error("collection_id and folder_id are required.");
        }
      },
    ),
    "builder.create_request": boundAction(
      "Create request",
      "Create a new saved request in a collection and open it",
      "medium",
      '{"collection_id":"<uuid>","name":"Get users","method":"GET","url":"/users","folder_id":null}',
      (payload) => {
        if (!payload?.collection_id) throw new Error("collection_id is required.");
      },
    ),
    "builder.delete_request": boundAction(
      "Delete request",
      "Permanently delete a saved request",
      "high",
      '{"collection_id":"<uuid>","request_id":"<uuid>"}',
      (payload) => {
        if (!payload?.collection_id || !payload?.request_id) {
          throw new Error("collection_id and request_id are required.");
        }
      },
    ),
    "builder.rename_request": boundAction(
      "Rename saved request",
      "Rename a persisted request in the explorer",
      "low",
      '{"collection_id":"<uuid>","request_id":"<uuid>","name":"New name"}',
      (payload) => {
        if (!payload?.collection_id || !payload?.request_id || !payload?.name?.trim()) {
          throw new Error("collection_id, request_id, and name are required.");
        }
      },
    ),
    "builder.move_request": boundAction(
      "Move request to folder",
      "Move a request into a folder or collection root",
      "low",
      '{"collection_id":"<uuid>","request_id":"<uuid>","folder_id":"<uuid>|null"}',
      (payload) => {
        if (!payload?.collection_id || !payload?.request_id) {
          throw new Error("collection_id and request_id are required.");
        }
      },
    ),
    "builder.reorder_request": boundAction(
      "Reorder request",
      "Reorder requests in the explorer (drag order)",
      "low",
      '{"collection_id":"<uuid>","from_request_id":"<uuid>","to_request_id":"<uuid>"}',
      (payload) => {
        if (!payload?.collection_id || !payload?.from_request_id || !payload?.to_request_id) {
          throw new Error("collection_id, from_request_id, and to_request_id are required.");
        }
      },
    ),
    "builder.patch_saved_request": boundAction(
      "Patch saved request",
      "Update a persisted request on the server (not the open draft)",
      "medium",
      '{"collection_id":"<uuid>","request_id":"<uuid>","patch":{"method":"POST","url":"/x"}}',
      (payload) => {
        if (!payload?.collection_id || !payload?.request_id || !payload?.patch) {
          throw new Error("collection_id, request_id, and patch are required.");
        }
      },
    ),
  },
});
