import { DecoratorNode } from "lexical";
import { cn } from "@/lib/utils";

export class ApiParamsTableNode extends DecoratorNode {
  static getType() {
    return "api-params-table";
  }

  static clone(node) {
    return new ApiParamsTableNode(node.__source, node.__rows, node.__key);
  }

  constructor(source, rows, key) {
    super(key);
    this.__source = source;
    this.__rows = rows;
  }

  getSource() {
    return this.getLatest().__source;
  }

  getRows() {
    return this.getLatest().__rows;
  }

  static importJSON(serialized) {
    return $createApiParamsTableNode(serialized.source, serialized.rows);
  }

  exportJSON() {
    return {
      type: "api-params-table",
      version: 1,
      source: this.__source,
      rows: this.__rows,
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
    return <ApiParamsTableBlock source={this.__source} rows={this.__rows} />;
  }
}

export function $createApiParamsTableNode(source, rows) {
  return new ApiParamsTableNode(source, rows);
}

export function $isApiParamsTableNode(node) {
  return node instanceof ApiParamsTableNode;
}

function ApiParamsTableBlock({ source, rows }) {
  const title = source === "headers" ? "Request headers" : "Query parameters";
  const visibleRows = (rows || []).filter((row) => row.key && row.enabled !== false);

  if (!visibleRows.length) {
    return (
      <div className="docs-api-block my-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{title}</div>
        <p className="mt-2 text-[12.5px] text-muted-foreground">No {source === "headers" ? "headers" : "parameters"} defined on this request.</p>
      </div>
    );
  }

  return (
    <div className="docs-api-block my-3 rounded-md border border-[hsl(var(--border))] overflow-hidden">
      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/40">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-[hsl(var(--border))]">
        <div>{source === "headers" ? "Key" : "Name"}</div>
        <div>{source === "headers" ? "Value" : "Example"}</div>
      </div>
      <div className="divide-y divide-[hsl(var(--border))]">
        {visibleRows.map((row) => (
          <div key={row.key} className="grid grid-cols-2 gap-2 px-3 py-2 text-[12.5px] font-mono">
            <div className="text-foreground/85">{row.key}</div>
            <div className={cn("text-muted-foreground", !row.value && "italic opacity-60")}>
              {row.value || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
