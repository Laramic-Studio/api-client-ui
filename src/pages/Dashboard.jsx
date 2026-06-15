import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Send, FolderTree, Boxes, Users, CheckCircle2, ArrowUpRight, Activity, Clock, Star } from "lucide-react";
import { DASH } from "@/constants/testIds";
import MethodBadge from "@/components/shared/MethodBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import { useNavigate } from "react-router-dom";

function StatCard({ label, value, delta, icon: Icon, testid }) {
  return (
    <div
      className="rounded-md border border-border bg-card p-4 hover:border-white/20 transition-colors"
      data-testid={testid}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-medium tracking-tight">{value}</div>
      {delta !== undefined && (
        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-[hsl(var(--success))]">
          <ArrowUpRight className="h-3 w-3" /> {delta}
          <span className="text-muted-foreground"> vs last week</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const history = useAppStore((s) => s.history);
  const collections = useAppStore((s) => s.collectionsMap[s.activeWorkspaceId] || []);
  const env = useAppStore((s) => s.environmentsMap[s.activeWorkspaceId] || []);
  const team = useAppStore((s) => s.team);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const passed = history.filter((h) => h.status < 400).length;
    return {
      total: history.length,
      collections: collections.length,
      env: env.length,
      team: team.length,
      passed,
      rate: history.length ? Math.round((passed / history.length) * 100) : 0,
    };
  }, [history, collections, env, team]);

  const [trend] = useState(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const calls = 40 + Math.floor(Math.random() * 220);
      const errors = Math.floor(calls * (0.04 + Math.random() * 0.12));
      return {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        calls,
        errors,
      };
    });
  });

  const successDist = useMemo(() => {
    const buckets = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
    history.forEach((h) => {
      if (h.status >= 500) buckets["5xx"]++;
      else if (h.status >= 400) buckets["4xx"]++;
      else if (h.status >= 300) buckets["3xx"]++;
      else buckets["2xx"]++;
    });
    return Object.entries(buckets).map(([k, v]) => ({ name: k, value: v }));
  }, [history]);

  const COLORS = ["#22C55E", "#8B5CF6", "#F59E0B", "#EF4444"];

  const activity = useMemo(() => {
    const colActivity = collections.map((c) => ({
      name: c.name,
      reqs: c.requests.length,
    }));
    return colActivity.slice(0, 7);
  }, [collections]);

  return (
    <div className="h-full overflow-auto p-6 space-y-6 grid-bg">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// overview</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Welcome back.</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">A snapshot of your workspace activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/builder")}
            className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2"
            data-testid="dash-new-request"
          >
            <Send className="h-3.5 w-3.5" /> New request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Requests" value={stats.total} delta="+12%" icon={Send} testid={DASH.stat("requests")} />
        <StatCard label="Collections" value={stats.collections} delta="+3" icon={FolderTree} testid={DASH.stat("collections")} />
        <StatCard label="Environments" value={stats.env} delta="+1" icon={Boxes} testid={DASH.stat("environments")} />
        <StatCard label="Team Members" value={stats.team} delta="+2" icon={Users} testid={DASH.stat("team")} />
        <StatCard label="Tests Passed" value={`${stats.passed} (${stats.rate}%)`} delta="+5%" icon={CheckCircle2} testid={DASH.stat("tests")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">API Calls Trend</div>
              <div className="text-[13px] text-foreground/85 mt-0.5">Last 14 days</div>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, borderRadius: 6 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="calls" stroke="#6366F1" strokeWidth={1.5} fill="url(#g1)" />
                <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Success Rate</div>
              <div className="text-[13px] text-foreground/85 mt-0.5">By status bucket</div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successDist}
                  innerRadius={48}
                  outerRadius={86}
                  dataKey="value"
                  stroke="#0A0A0A"
                  strokeWidth={2}
                >
                  {successDist.map((entry, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#A1A1AA" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Collection Activity</div>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717A" }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="reqs" fill="#6366F1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-md border border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Recent Activity</div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {history.slice(0, 10).map((h) => (
              <div key={h.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-accent/50 cursor-pointer" onClick={() => navigate("/history")}>
                <MethodBadge method={h.method} className="w-14" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] truncate font-mono">{h.url}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider">
                    {new Date(h.timestamp).toLocaleString()} • {h.durationMs}ms
                  </div>
                </div>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Pinned Collections</div>
          <Star className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-accent/50">
          {collections.filter((c) => c.pinned).slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate("/collections")}
              className="text-left bg-card hover:bg-accent/50 transition-colors p-4"
              data-testid={`pinned-${c.id}`}
            >
              <div className="text-[13px] font-medium">{c.name}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">{c.requests.length} requests</div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {c.requests.slice(0, 4).map((r) => (
                  <MethodBadge key={r.id} method={r.method} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
