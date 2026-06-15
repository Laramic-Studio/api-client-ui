// URL input with [[VAR]] autocomplete from the active environment.
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function UrlInput({ value, onChange, onEnter, placeholder, testid }) {
  const env = useAppStore((s) => s.getActiveEnvironment());
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [pos, setPos] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const suggestions = useMemo(() => {
    if (!open || !env) return [];
    // detect partial `[[X` before caret
    const before = (value || "").slice(0, pos);
    const m = before.match(/\[\[([A-Z0-9_]*)$/i);
    if (!m) return [];
    const prefix = m[1].toUpperCase();
    return (env.variables || [])
      .filter((v) => v.enabled !== false && v.key.toUpperCase().startsWith(prefix))
      .slice(0, 8);
  }, [open, value, pos, env]);

  useEffect(() => {
    setActiveIdx((idx) => (idx >= suggestions.length ? 0 : idx));
  }, [suggestions.length]);

  const insertAt = (k) => {
    const before = (value || "").slice(0, pos).replace(/\[\[([A-Z0-9_]*)$/i, "");
    const after = (value || "").slice(pos);
    const next = `${before}[[${k}]]${after}`;
    onChange(next);
    const caret = before.length + k.length + 4;
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(caret, caret);
        inputRef.current.focus();
      }
    });
    setOpen(false);
  };

  const handleKey = (e) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertAt(suggestions[activeIdx].key);
        return;
      }
      if (e.key === "Escape") { setOpen(false); return; }
    }
    if (e.key === "Enter" && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  // Render highlighted preview behind input
  const highlighted = useMemo(() => {
    if (!value) return null;
    const parts = [];
    let lastIdx = 0;
    const re = /\[\[\s*([A-Z0-9_]+)\s*\]\]|\{\{\s*([A-Z0-9_]+)\s*\}\}/gi;
    let match;
    while ((match = re.exec(value)) !== null) {
      const key = match[1] || match[2];
      const v = env?.variables?.find((x) => x.enabled !== false && x.key === key);
      if (match.index > lastIdx) parts.push({ text: value.slice(lastIdx, match.index), kind: "text" });
      parts.push({ text: match[0], kind: v ? "var-ok" : "var-missing", key, value: v?.value });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < value.length) parts.push({ text: value.slice(lastIdx), kind: "text" });
    return parts;
  }, [value, env]);

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* underlay highlight (decorative) */}
      <div
        aria-hidden
        className="absolute inset-0 h-9 px-3 rounded-md font-mono text-[13px] whitespace-pre overflow-hidden flex items-center pointer-events-none"
      >
        <div className="truncate text-transparent">
          {highlighted?.map((p, i) =>
            p.kind === "text" ? (
              <span key={i}>{p.text}</span>
            ) : (
              <span
                key={i}
                title={p.value || "(not set)"}
                className={cn(
                  "rounded px-0.5",
                  p.kind === "var-ok"
                    ? "bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]"
                    : "bg-[hsl(var(--danger))]/15 text-[hsl(var(--danger))]"
                )}
              >
                {p.text}
              </span>
            )
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); setPos(e.target.selectionStart || 0); setOpen(true); }}
        onSelect={(e) => setPos(e.target.selectionStart || 0)}
        onKeyDown={handleKey}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        data-testid={testid}
        spellCheck={false}
        className="relative w-full h-9 px-3 rounded-md bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[13px] font-mono ring-focus bg-transparent"
        style={{ caretColor: "currentColor" }}
      />

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1 z-50 min-w-[220px] max-h-64 overflow-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] shadow-xl"
          data-testid={testid ? `${testid}-suggestions` : undefined}
        >
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Variables · {env?.name || "no env"}
          </div>
          {suggestions.map((s, i) => (
            <button
              key={s.key}
              onMouseDown={(e) => { e.preventDefault(); insertAt(s.key); }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-left text-[12.5px]",
                i === activeIdx ? "bg-[hsl(var(--brand))]/15" : "hover:bg-accent/50"
              )}
            >
              <span className="font-mono font-semibold text-[hsl(var(--brand))]">{s.key}</span>
              <span className="ml-auto truncate text-muted-foreground font-mono text-[11px] max-w-[140px]">{s.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
