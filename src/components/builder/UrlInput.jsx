// URL input with [[VAR]] autocomplete from the active environment.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getCaretIndexFromMouse, getVariableAtIndex } from "@/lib/builder/url-variables";

export default function UrlInput({
  value,
  onChange,
  onEnter,
  onUpdateVariable,
  placeholder,
  testid,
  grouped = false,
  env = null,
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  const [pos, setPos] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoverVar, setHoverVar] = useState(null);
  const [editValue, setEditValue] = useState("");

  const suggestions = useMemo(() => {
    if (!open || !env) return [];
    const before = (value || "").slice(0, pos);
    const m = before.match(/\[\[([A-Z0-9_]*)$/i);
    if (!m) return [];
    const prefix = (m[1] || "").toUpperCase();
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

  const resolveVarValue = useCallback((key) => {
    const v = env?.variables?.find((x) => x.enabled !== false && x.key === key);
    return v?.value ?? "";
  }, [env]);

  const handleMouseMove = (e) => {
    const idx = getCaretIndexFromMouse(inputRef.current, e.clientX);
    const hit = getVariableAtIndex(value, idx);
    if (!hit) {
      setHoverVar(null);
      return;
    }
    if (hoverVar?.key !== hit.key) {
      setHoverVar(hit);
      setEditValue(resolveVarValue(hit.key));
    }
  };

  const commitVariableEdit = () => {
    if (!hoverVar || !onUpdateVariable) return;
    onUpdateVariable(hoverVar.key, editValue);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 h-9 px-3 font-mono text-[13px] whitespace-pre overflow-hidden flex items-center pointer-events-none",
          grouped ? "rounded-none" : "rounded-md",
        )}
      >
        <div className="truncate text-transparent">
          {highlighted?.map((p, i) =>
            p.kind === "text" ? (
              <span key={i}>{p.text}</span>
            ) : (
              <span
                key={i}
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
        onChange={(e) => {
          onChange(e.target.value);
          setPos(e.target.selectionStart || 0);
          setOpen(true);
        }}
        onSelect={(e) => setPos(e.target.selectionStart || 0)}
        onKeyDown={handleKey}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false);
            if (!containerRef.current?.contains(document.activeElement)) {
              setHoverVar(null);
            }
          }, 120);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          if (popoverRef.current?.contains(e.relatedTarget)) return;
          setHoverVar(null);
        }}
        placeholder={placeholder}
        data-testid={testid}
        spellCheck={false}
        className={cn(
          "relative w-full h-9 px-3 text-[13px] font-mono ring-focus bg-transparent",
          grouped
            ? "border-0 rounded-none focus-visible:outline-none"
            : "rounded-md bg-[hsl(var(--input))] border border-[hsl(var(--border))]",
        )}
        style={{ caretColor: "currentColor" }}
      />

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1 z-50 min-w-[220px] max-w-[320px] max-h-64 overflow-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] shadow-xl"
          data-testid={testid ? `${testid}-suggestions` : undefined}
        >
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Variables · {env?.name || "no env"}
          </div>
          {suggestions.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertAt(s.key); }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-left text-[12.5px]",
                i === activeIdx ? "bg-[hsl(var(--brand))]/15" : "hover:bg-accent/50",
              )}
            >
              <span className="font-mono font-semibold text-[hsl(var(--brand))]">[[{s.key}]]</span>
              <span className="ml-auto truncate text-muted-foreground font-mono text-[11px] max-w-[140px]">{s.value}</span>
            </button>
          ))}
        </div>
      )}

      {hoverVar && onUpdateVariable && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1 z-50 w-72 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] shadow-xl p-3"
          data-testid={testid ? `${testid}-var-popover` : undefined}
          onMouseDown={(e) => e.preventDefault()}
          onMouseLeave={(e) => {
            if (inputRef.current?.contains(e.relatedTarget)) return;
            setHoverVar(null);
          }}
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">
            {env?.name || "Environment"}
          </div>
          <label className="text-[11px] text-muted-foreground font-mono block mb-1">
            [[{hoverVar.key}]]
          </label>
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitVariableEdit();
                setHoverVar(null);
                inputRef.current?.focus();
              }
              if (e.key === "Escape") setHoverVar(null);
            }}
            onBlur={() => {
              commitVariableEdit();
              setHoverVar(null);
            }}
            className="w-full h-8 px-2 rounded-md bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[12px] font-mono ring-focus"
            placeholder="Variable value"
          />
        </div>
      )}
    </div>
  );
}
