// URL input with [[VAR]] autocomplete from the active environment.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  getCaretIndexFromMouse,
  getVariableAnchorLeft,
  getVariableAtIndex,
} from "@/lib/builder/url-variables";
import { looksLikeCurl, parseCurlCommand } from "@/lib/builder/parse-curl";

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export default function UrlInput({
  value,
  onChange,
  onEnter,
  onUpdateVariable,
  onImportCurl,
  placeholder,
  testid,
  grouped = false,
  compact = false,
  env = null,
  conduitVarKeys = [],
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  const editRef = useRef(null);
  const [pos, setPos] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoverVar, setHoverVar] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [popoverPinned, setPopoverPinned] = useState(false);
  const [tooltipPos, setTooltipPos] = useState(null);

  const suggestions = useMemo(() => {
    if (!open) return [];
    const before = (value || "").slice(0, pos);

    const envMatch = before.match(/\[\[([A-Z0-9_]*)$/i);
    if (envMatch && env) {
      const prefix = (envMatch[1] || "").toUpperCase();
      return (env.variables || [])
        .filter((v) => v.enabled !== false && v.key.toUpperCase().startsWith(prefix))
        .slice(0, 8)
        .map((v) => ({ kind: "env", key: v.key, value: v.value }));
    }

    const flowMatch = before.match(/\{([a-zA-Z0-9_.]*)$/);
    if (flowMatch && conduitVarKeys.length > 0) {
      const prefix = (flowMatch[1] || "").toLowerCase();
      return conduitVarKeys
        .filter((k) => k.toLowerCase().startsWith(prefix))
        .slice(0, 8)
        .map((k) => ({ kind: "flow", key: k }));
    }

    return [];
  }, [open, value, pos, env, conduitVarKeys]);

  useEffect(() => {
    setActiveIdx((idx) => (idx >= suggestions.length ? 0 : idx));
  }, [suggestions.length]);

  const resolveVarValue = useCallback((key) => {
    const v = env?.variables?.find((x) => x.enabled !== false && x.key === key);
    return v?.value ?? "";
  }, [env]);

  const updateHoverAnchor = useCallback((hit) => {
    const input = inputRef.current;
    if (!hit || !input) return null;

    const anchorLeft = getVariableAnchorLeft(input, value, hit);
    const container = containerRef.current;
    const maxLeft = container ? container.clientWidth - 12 : anchorLeft;
    return {
      ...hit,
      anchorLeft: clamp(anchorLeft, 12, maxLeft),
    };
  }, [value]);

  const syncTooltipPos = useCallback(() => {
    if (!hoverVar || !inputRef.current) {
      setTooltipPos(null);
      return;
    }
    const rect = inputRef.current.getBoundingClientRect();
    setTooltipPos({
      left: rect.left + hoverVar.anchorLeft,
      top: rect.top,
    });
  }, [hoverVar]);

  useLayoutEffect(() => {
    syncTooltipPos();
  }, [syncTooltipPos]);

  useEffect(() => {
    if (!hoverVar) return undefined;

    const onScrollOrResize = () => syncTooltipPos();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [hoverVar, syncTooltipPos]);

  const insertSuggestion = (item) => {
    let before;
    let after;
    let next;
    let caret;

    if (item.kind === "flow") {
      before = (value || "").slice(0, pos).replace(/\{([a-zA-Z0-9_.]*)$/, "");
      after = (value || "").slice(pos);
      next = `${before}{${item.key}}${after}`;
      caret = before.length + item.key.length + 2;
    } else {
      before = (value || "").slice(0, pos).replace(/\[\[([A-Z0-9_]*)$/i, "");
      after = (value || "").slice(pos);
      next = `${before}[[${item.key}]]${after}`;
      caret = before.length + item.key.length + 4;
    }

    onChange(next);
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
        insertSuggestion(suggestions[activeIdx]);
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
    const re = /\[\[\s*([A-Z0-9_]+)\s*\]\]|\{\{\s*([A-Z0-9_]+)\s*\}\}|\{([a-zA-Z0-9_.]+)\}/gi;
    let match;
    while ((match = re.exec(value)) !== null) {
      const key = match[1] || match[2] || match[3];
      const isFlow = Boolean(match[3]);
      const envVar = env?.variables?.find((x) => x.enabled !== false && x.key === key);
      const flowOk = isFlow && conduitVarKeys.includes(key);
      if (match.index > lastIdx) parts.push({ text: value.slice(lastIdx, match.index), kind: "text" });
      parts.push({
        text: match[0],
        kind: (isFlow ? flowOk : envVar) ? "var-ok" : "var-missing",
        key,
        value: envVar?.value,
      });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < value.length) parts.push({ text: value.slice(lastIdx), kind: "text" });
    return parts;
  }, [value, env, conduitVarKeys]);

  const inputHeight = compact ? "h-8" : "h-9";
  const inputText = compact ? "text-[12px]" : "text-[13px]";

  const closePopover = useCallback(() => {
    setHoverVar(null);
    setPopoverPinned(false);
  }, []);

  const commitVariableEdit = useCallback(() => {
    if (!hoverVar || !onUpdateVariable) return;
    onUpdateVariable(hoverVar.key, editValue);
  }, [hoverVar, editValue, onUpdateVariable]);

  const handleMouseMove = (e) => {
    if (popoverPinned) return;

    const idx = getCaretIndexFromMouse(inputRef.current, e.clientX);
    const hit = getVariableAtIndex(value, idx);
    if (!hit) {
      setHoverVar(null);
      return;
    }

    const anchored = updateHoverAnchor(hit);
    if (!anchored) return;

    if (hoverVar?.key !== hit.key || hoverVar?.start !== hit.start) {
      setEditValue(resolveVarValue(hit.key));
    }
    setHoverVar(anchored);
  };

  const handleInputScroll = () => {
    if (!hoverVar) return;
    setHoverVar((current) => {
      if (!current) return null;
      return updateHoverAnchor(current);
    });
  };

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData("text/plain")?.trim();
    if (!text || !onImportCurl || !looksLikeCurl(text)) return;

    const parsed = parseCurlCommand(text);
    if (!parsed?.url) return;

    e.preventDefault();
    onImportCurl(parsed);
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 px-3 font-soro whitespace-pre overflow-hidden flex items-center pointer-events-none",
          inputHeight,
          inputText,
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
          if (!popoverPinned) setHoverVar(null);
        }}
        onSelect={(e) => setPos(e.target.selectionStart || 0)}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        onScroll={handleInputScroll}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false);
            if (!containerRef.current?.contains(document.activeElement)) {
              commitVariableEdit();
              closePopover();
            }
          }, 120);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          if (popoverPinned || popoverRef.current?.contains(e.relatedTarget)) return;
          closePopover();
        }}
        placeholder={placeholder}
        data-testid={testid}
        spellCheck={false}
        className={cn(
          "relative w-full px-3 font-soro bg-transparent focus:border-none focus:outline-none focus:ring-0 focus:ring-offset-0",
          inputHeight,
          inputText,
          grouped
            ? "border-0 rounded-none"
            : "rounded-md bg-[hsl(var(--input))] focus:border-none focus:ring-0 focus:ring-offset-0",
        )}
        style={{ caretColor: "currentColor" }}
      />

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1 z-50 min-w-[220px] max-w-[320px] max-h-64 overflow-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] shadow-xl"
          data-testid={testid ? `${testid}-suggestions` : undefined}
        >
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            {suggestions[0]?.kind === "flow"
              ? "Flow variables"
              : `Variables · ${env?.name || "no env"}`}
          </div>
          {suggestions.map((s, i) => (
            <button
              key={`${s.kind}-${s.key}`}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertSuggestion(s); }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-left text-[12.5px]",
                i === activeIdx ? "bg-[hsl(var(--brand))]/15" : "hover:bg-accent/50",
              )}
            >
              <span className="font-mono font-semibold text-[hsl(var(--brand))]">
                {s.kind === "flow" ? `{${s.key}}` : `[[${s.key}]]`}
              </span>
              {s.kind === "env" && (
                <span className="ml-auto truncate text-muted-foreground font-mono text-[11px] max-w-[140px]">{s.value}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {hoverVar && tooltipPos && createPortal(
        <div
          ref={popoverRef}
          role="tooltip"
          style={{
            position: "fixed",
            left: tooltipPos.left,
            top: tooltipPos.top,
            transform: "translate(-50%, calc(-100% - 8px))",
            zIndex: 9999,
          }}
          className="w-max max-w-[min(17rem,calc(100vw-2rem))] rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] px-2.5 py-2 shadow-md pointer-events-auto"
          data-testid={testid ? `${testid}-var-popover` : undefined}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => {
            if (!onUpdateVariable) return;
            setPopoverPinned(true);
            editRef.current?.focus();
          }}
          onMouseLeave={(e) => {
            if (inputRef.current?.contains(e.relatedTarget)) return;
            commitVariableEdit();
            closePopover();
          }}
        >
          <div
            className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[hsl(var(--border))] bg-[hsl(var(--popover))]"
            aria-hidden
          />
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter">
            {env?.name || "Environment"}
          </div>
          {onUpdateVariable ? (
            <input
              ref={editRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitVariableEdit();
                  closePopover();
                  inputRef.current?.focus();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  closePopover();
                  inputRef.current?.focus();
                }
              }}
              className="mt-1.5 w-full min-w-[10rem] h-7 px-2 rounded border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[11px] font-mono ring-focus"
              placeholder="Value"
            />
          ) : (
            <div className="mt-1 text-[11px] font-mono text-muted-foreground truncate max-w-[14rem]">
              {editValue || "—"}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
