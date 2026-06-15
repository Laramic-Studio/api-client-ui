import Editor from "@monaco-editor/react";

export default function DocsPanel({ value, onChange }) {
  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 min-h-0">
      <div className="min-h-0 border-r border-[hsl(var(--border))]">
        <div className="h-8 flex items-center px-3 border-b border-[hsl(var(--border))] text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          Markdown
        </div>
        <div className="h-[calc(100%-2rem)]">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            language="markdown"
            value={value || ""}
            onChange={(v) => onChange(v || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "JetBrains Mono, monospace",
              wordWrap: "on",
              padding: { top: 10 },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
      <div className="min-h-0 overflow-auto">
        <div className="h-8 flex items-center px-3 border-b border-[hsl(var(--border))] text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          Preview
        </div>
        <div className="p-4 prose prose-invert prose-sm max-w-none">
          {value ? <MarkdownLite text={value} /> : <div className="text-muted-foreground text-[12.5px]">Nothing to preview yet. Document this request on the left.</div>}
        </div>
      </div>
    </div>
  );
}

// Tiny markdown-to-React renderer (headings, bold, italic, inline code, code blocks, lists, links).
function MarkdownLite({ text }) {
  const lines = text.split("\n");
  const out = [];
  let buf = [];
  let inCode = false;
  let codeLang = "";
  const flushPara = () => {
    if (!buf.length) return;
    out.push(<p key={out.length} className="text-[13.5px] leading-relaxed text-foreground/90">{inline(buf.join(" "))}</p>);
    buf = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("```")) {
      flushPara();
      if (inCode) {
        out.push(
          <pre key={out.length} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--input))] p-3 text-[12px] font-mono overflow-auto">
            <code data-lang={codeLang}>{buf.join("\n")}</code>
          </pre>
        );
        buf = []; inCode = false; codeLang = "";
      } else {
        inCode = true; codeLang = l.slice(3).trim();
      }
      continue;
    }
    if (inCode) { buf.push(l); continue; }
    if (/^#\s/.test(l)) { flushPara(); out.push(<h1 key={out.length} className="text-2xl font-medium tracking-tight mt-3 mb-2">{inline(l.replace(/^#\s/, ""))}</h1>); continue; }
    if (/^##\s/.test(l)) { flushPara(); out.push(<h2 key={out.length} className="text-lg font-medium tracking-tight mt-3 mb-2">{inline(l.replace(/^##\s/, ""))}</h2>); continue; }
    if (/^###\s/.test(l)) { flushPara(); out.push(<h3 key={out.length} className="text-base font-medium tracking-tight mt-2 mb-1">{inline(l.replace(/^###\s/, ""))}</h3>); continue; }
    if (/^[-*]\s/.test(l)) { flushPara(); out.push(<li key={out.length} className="ml-5 list-disc text-[13px] text-foreground/90">{inline(l.replace(/^[-*]\s/, ""))}</li>); continue; }
    if (l.trim() === "") { flushPara(); continue; }
    buf.push(l);
  }
  flushPara();
  return <>{out}</>;
}

function inline(s) {
  // bold, italic, code, link
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0; let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[2]) parts.push(<strong key={parts.length} className="font-semibold">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={parts.length} className="italic">{m[3]}</em>);
    else if (m[4]) parts.push(<code key={parts.length} className="px-1 py-0.5 rounded bg-[hsl(var(--input))] font-mono text-[12px]">{m[4]}</code>);
    else if (m[5] && m[6]) parts.push(<a key={parts.length} href={m[6]} className="text-[hsl(var(--brand))] hover:underline">{m[5]}</a>);
    last = re.lastIndex;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}
