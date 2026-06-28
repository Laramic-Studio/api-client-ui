import { useState } from "react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";

const MONITORS = [
  { name: "Auth Service", url: "https://api.noidr.dev/auth/health", uptime: 99.98 },
  { name: "Payments", url: "https://api.noidr.dev/payments/health", uptime: 99.81 },
  { name: "Users API", url: "https://api.noidr.dev/users/health", uptime: 100.0 },
  { name: "Webhooks", url: "https://api.noidr.dev/webhooks/health", uptime: 98.42 },
  { name: "Search Engine", url: "https://api.noidr.dev/search/health", uptime: 99.55 },
];

export default function Monitoring() {
  const [series] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      h: `${i}:00`,
      p50: 70 + Math.floor(Math.random() * 80),
      p95: 180 + Math.floor(Math.random() * 220),
      p99: 320 + Math.floor(Math.random() * 380),
      errors: Math.floor(Math.random() * 12),
    }))
  );
  const [errorDist] = useState(() => [
    { name: "5xx", value: 4 + Math.floor(Math.random() * 8) },
    { name: "4xx", value: 18 + Math.floor(Math.random() * 22) },
    { name: "Timeout", value: 2 + Math.floor(Math.random() * 4) },
    { name: "DNS", value: 1 + Math.floor(Math.random() * 2) },
  ]);

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-geom">// observability</div>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">Monitoring</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Synthetic uptime, response time and error rate across your monitors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: "Uptime (30d)", value: "99.92%", delta: "+0.04%", up: true },
          { label: "Avg p95 latency", value: "238ms", delta: "-12ms", up: true },
          { label: "Error rate", value: "0.78%", delta: "-0.12%", up: true },
          { label: "Monitors", value: MONITORS.length, delta: "5 healthy", up: true },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-geom">{s.label}</div>
            <div className="mt-2 text-2xl font-medium tracking-tight">{s.value}</div>
            <div className={`mt-1 inline-flex items-center gap-1 text-[11px] ${s.up ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"}`}>
              {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {s.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-geom">Response time (24h)</div>
              <div className="text-[13px] text-foreground/85 mt-0.5">p50, p95, p99 across monitors</div>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g50" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#A1A1AA" }} />
                <Area type="monotone" dataKey="p50" stroke="#22C55E" strokeWidth={1.5} fill="url(#g50)" />
                <Area type="monotone" dataKey="p95" stroke="#6366F1" strokeWidth={1.5} fillOpacity={0} />
                <Area type="monotone" dataKey="p99" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-geom mb-3">Error distribution</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorDist} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="value" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-geom">Monitors</div>
        <div className="divide-y divide-border">
          {MONITORS.map((m) => (
            <div key={m.name} className="grid grid-cols-[1fr_auto_120px_120px] gap-3 items-center px-4 py-3">
              <div>
                <div className="text-[13px] font-medium">{m.name}</div>
                <div className="text-[11px] text-muted-foreground font-geom">{m.url}</div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 30 }).map((_, i) => {
                  const ok = Math.random() > 0.05;
                  return <span key={i} className={`h-5 w-1 rounded-sm ${ok ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--danger))]"}`} />;
                })}
              </div>
              <div className="text-right text-[12px] font-geom text-foreground/85">{m.uptime.toFixed(2)}%</div>
              <div className="text-right text-[11px] text-muted-foreground font-geom uppercase tracking-wider">Synthetic 30d</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
