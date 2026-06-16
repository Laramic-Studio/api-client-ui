const VAR_RE = /\[\[\s*([A-Z0-9_]+)\s*\]\]|\{\{\s*([A-Z0-9_]+)\s*\}\}/gi;

export function parseUrlVariables(value) {
  const vars = [];
  if (!value) return vars;
  const re = new RegExp(VAR_RE.source, "gi");
  let match;
  while ((match = re.exec(value)) !== null) {
    vars.push({
      key: match[1] || match[2],
      start: match.index,
      end: match.index + match[0].length,
      raw: match[0],
    });
  }
  return vars;
}

export function getVariableAtIndex(value, index) {
  return parseUrlVariables(value).find((v) => index >= v.start && index < v.end) || null;
}

export function isRequestUrlEmpty(url) {
  return !String(url ?? "").trim();
}

let measureCanvas;
function measureCharIndex(text, targetX, font) {
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  ctx.font = font;
  for (let i = 0; i <= text.length; i += 1) {
    if (ctx.measureText(text.slice(0, i)).width >= targetX) {
      return Math.max(0, i - 1);
    }
  }
  return text.length;
}

export function getCaretIndexFromMouse(input, clientX) {
  if (!input) return 0;
  const rect = input.getBoundingClientRect();
  const style = window.getComputedStyle(input);
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const relativeX = clientX - rect.left - padLeft + input.scrollLeft;
  const font = `${style.fontSize} ${style.fontFamily}`;
  return measureCharIndex(input.value || "", relativeX, font);
}
