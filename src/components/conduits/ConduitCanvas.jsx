import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MethodBadge from "@/components/shared/MethodBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, Plus, Trash2 } from "lucide-react";

const NODE_W = 200;
const NODE_H = 88;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

function edgePath(source, target) {
  const x1 = source.x + NODE_W;
  const y1 = source.y + NODE_H / 2;
  const x2 = target.x;
  const y2 = target.y + NODE_H / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export default function ConduitCanvas({
  steps,
  layout,
  selectedStepId,
  connectMode,
  onSelectStep,
  onMoveStep,
  onConnect,
  onDeleteEdge,
  onAddStep,
}) {
  const containerRef = useRef(null);
  const panRef = useRef({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState(null);
  const [panDrag, setPanDrag] = useState(null);
  const [connectFrom, setConnectFrom] = useState(null);

  panRef.current = pan;

  const positions = useMemo(() => {
    const map = {};
    steps.forEach((s, i) => {
      map[s.id] = s.position || { x: 80 + i * 280, y: 120 };
    });
    return map;
  }, [steps]);

  const edges = layout?.edges || [];

  const zoomIn = () => setZoom((z) => clampZoom(+(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => clampZoom(+(z - ZOOM_STEP).toFixed(2)));

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => clampZoom(z - e.deltaY * 0.001));
  }, []);

  const startPan = useCallback((e) => {
    const isMiddle = e.button === 1;
    const isLeft = e.button === 0;
    if (!isMiddle && !isLeft) return;

    if (isLeft) {
      if (e.target.closest("[data-conduit-node]")) return;
      if (e.target.closest("button")) return;
    }

    e.preventDefault();
    onSelectStep(null);
    setConnectFrom(null);
    setPanDrag({
      ox: e.clientX,
      oy: e.clientY,
      x: panRef.current.x,
      y: panRef.current.y,
    });
  }, [onSelectStep]);

  const onNodeMouseDown = (e, step) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelectStep(step.id);
    const pos = positions[step.id];
    setDrag({ id: step.id, ox: e.clientX, oy: e.clientY, x: pos.x, y: pos.y });
  };

  useEffect(() => {
    if (!drag && !panDrag) return undefined;

    const onMove = (e) => {
      if (drag) {
        const dx = (e.clientX - drag.ox) / zoom;
        const dy = (e.clientY - drag.oy) / zoom;
        onMoveStep(drag.id, { x: Math.round(drag.x + dx), y: Math.round(drag.y + dy) });
      } else if (panDrag) {
        setPan({
          x: panDrag.x + (e.clientX - panDrag.ox),
          y: panDrag.y + (e.clientY - panDrag.oy),
        });
      }
    };

    const onUp = () => {
      setDrag(null);
      setPanDrag(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, panDrag, zoom, onMoveStep]);

  const handlePortClick = (e, stepId, port) => {
    e.stopPropagation();
    if (!connectMode) return;
    if (port === "out") {
      setConnectFrom(stepId);
      return;
    }
    if (connectFrom && connectFrom !== stepId) {
      onConnect(connectFrom, stepId);
      setConnectFrom(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full min-h-[200px] overflow-hidden",
        panDrag ? "cursor-grabbing" : "cursor-grab",
      )}
      onMouseDown={startPan}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        data-canvas-bg="true"
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <svg className="absolute inset-0 w-[4000px] h-[2000px] pointer-events-none overflow-visible">
          {edges.map((edge) => {
            const src = positions[edge.source];
            const tgt = positions[edge.target];
            if (!src || !tgt) return null;
            return (
              <g key={edge.id}>
                <path
                  d={edgePath(src, tgt)}
                  fill="none"
                  stroke="hsl(var(--brand))"
                  strokeWidth="2"
                  opacity="0.7"
                />
              </g>
            );
          })}
          {connectFrom && positions[connectFrom] && (
            <circle
              cx={positions[connectFrom].x + NODE_W}
              cy={positions[connectFrom].y + NODE_H / 2}
              r="6"
              fill="hsl(var(--brand))"
            />
          )}
        </svg>

        {steps.map((step) => {
          const pos = positions[step.id] || { x: 0, y: 0 };
          const selected = selectedStepId === step.id;
          return (
            <div
              key={step.id}
              data-conduit-node
              className={cn(
                "absolute rounded-md border bg-card shadow-sm cursor-grab active:cursor-grabbing select-none",
                selected ? "border-[hsl(var(--brand))] ring-1 ring-[hsl(var(--brand))]/40" : "border-border",
              )}
              style={{ left: pos.x, top: pos.y, width: NODE_W, minHeight: NODE_H }}
              onMouseDown={(e) => onNodeMouseDown(e, step)}
            >
              <div className="px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <MethodBadge method={step.method} />
                  <span className="text-[12px] font-medium truncate flex-1">{step.name}</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground font-mono truncate">{step.url || "No URL"}</div>
                {step.extractions?.length > 0 && (
                  <div className="mt-1 text-[9px] uppercase tracking-wider text-[hsl(var(--brand))] font-mono">
                    {step.extractions.length} extract{step.extractions.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
              {connectMode && (
                <>
                  <button
                    type="button"
                    className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-muted-foreground/50 hover:bg-[hsl(var(--brand))] border border-border"
                    onClick={(e) => handlePortClick(e, step.id, "in")}
                    title="Connect in"
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-muted-foreground/50 hover:bg-[hsl(var(--brand))] border border-border"
                    onClick={(e) => handlePortClick(e, step.id, "out")}
                    title="Connect out"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={onAddStep}
          className="h-8 px-2.5 rounded-md bg-[hsl(var(--brand))] text-[12px] font-medium inline-flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Add step
        </button>
        {edges.length > 0 && (
          <div className="text-[11px] text-muted-foreground font-mono">{edges.length} connection{edges.length > 1 ? "s" : ""}</div>
        )}
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-0.5 rounded-md border border-border bg-card/95 p-0.5 shadow-sm pointer-events-auto">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          title="Zoom out"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[40px] text-center text-[11px] font-mono text-muted-foreground select-none">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          title="Zoom in"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {edges.length > 0 && (
        <div className="absolute top-3 right-3 z-20 max-w-[200px] space-y-1 pointer-events-auto">
          {edges.map((edge) => (
            <div key={edge.id} className="flex items-center gap-1 text-[10px] bg-card border border-border rounded px-2 py-1">
              <span className="truncate font-mono text-muted-foreground">{edge.source.slice(0, 6)}→{edge.target.slice(0, 6)}</span>
              <button type="button" onClick={() => onDeleteEdge(edge.id)} className="text-muted-foreground hover:text-[hsl(var(--danger))]">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
