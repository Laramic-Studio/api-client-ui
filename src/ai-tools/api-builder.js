import { defineAction, defineTool } from "@/ai-tools/types";

export const apiBuilderTool = defineTool({
  id: "api-builder",
  scope: "page",
  pageId: "api-builder",
  description: "API Builder — edit, send, and save HTTP requests",
  actions: {
    "builder.apply_draft": defineAction({
      label: "Apply to request",
      description: "Update the open request draft locally without saving",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"spec":{"method":"GET","url":"/path","headers":[],"params":[],"body":{"type":"json","content":"{}"},"auth":{"type":"none"},"tests":"","preScript":"","docs":""}}',
      validate(payload) {
        if (!payload?.spec || typeof payload.spec !== "object") {
          throw new Error("Missing spec in payload.");
        }
      },
    }),
    "builder.save_request": defineAction({
      label: "Save request",
      description: "Save the current request to its collection",
      risk: "medium",
      requiresBinding: true,
      payloadHint: "{}",
    }),
    "builder.send_request": defineAction({
      label: "Send request",
      description: "Send the open request (user sees the network call and response)",
      risk: "low",
      requiresBinding: true,
      payloadHint: "{}",
    }),
  },
});
