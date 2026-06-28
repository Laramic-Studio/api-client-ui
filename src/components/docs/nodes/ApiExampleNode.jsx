import { DecoratorNode } from "lexical";
import MethodBadge from "@/components/shared/MethodBadge";
import { formatExampleBody } from "@/components/docs/DocsRequestContext";

export class ApiExampleNode extends DecoratorNode {
  static getType() {
    return "api-example";
  }

  static clone(node) {
    return new ApiExampleNode(node.__example, node.__key);
  }

  constructor(example, key) {
    super(key);
    this.__example = example;
  }

  getExample() {
    return this.getLatest().__example;
  }

  static importJSON(serialized) {
    return $createApiExampleNode(serialized.example);
  }

  exportJSON() {
    return {
      type: "api-example",
      version: 1,
      example: this.__example,
    };
  }

  createDOM() {
    return document.createElement("div");
  }

  updateDOM() {
    return false;
  }

  isInline() {
    return false;
  }

  decorate() {
    return <ApiExampleBlock example={this.__example} />;
  }
}

export function $createApiExampleNode(example) {
  return new ApiExampleNode(example);
}

export function $isApiExampleNode(node) {
  return node instanceof ApiExampleNode;
}

function ApiExampleBlock({ example }) {
  const bodyText = formatExampleBody(example?.body);
  const statusLabel = [example?.status, example?.statusText].filter(Boolean).join(" ");

  return (
    <div className="docs-api-block my-3 rounded-md border border-[hsl(var(--border))] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/40">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom">Example response</span>
        {example?.method && <MethodBadge method={example.method} className="ml-1" />}
        {statusLabel && (
          <span className="ml-auto text-[11px] font-geom text-muted-foreground">{statusLabel}</span>
        )}
      </div>
      {example?.name && (
        <div className="px-3 py-1.5 text-[12px] text-foreground/85 border-b border-[hsl(var(--border))]">
          {example.name}
        </div>
      )}
      <pre className="max-h-64 overflow-auto p-3 text-[12px] font-geom leading-relaxed text-foreground/90 bg-[hsl(var(--input))]">
        <code>{bodyText || "{}"}</code>
      </pre>
    </div>
  );
}
