import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Plus, Trash2, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ROLES = ["Owner", "Admin", "Developer", "Viewer"];

export default function Team() {
  const team = useAppStore((s) => s.team);
  const add = useAppStore((s) => s.addTeamMember);
  const update = useAppStore((s) => s.updateTeamMember);
  const remove = useAppStore((s) => s.removeTeamMember);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Developer");

  const invite = () => {
    if (!email.includes("@")) return toast.error("Enter a valid email");
    add({ name: email.split("@")[0], email, role });
    setEmail("");
    toast.success(`Invited ${email}`);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// collaboration</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Team</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Invite people, manage roles, and collaborate in real-time.</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4 mb-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Invite member</div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="w-full h-9 pl-8 pr-2 rounded-md bg-muted border border-border text-[13px] placeholder:text-muted-foreground"
              data-testid="invite-email"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9 w-40 bg-muted border-border text-[13px]" data-testid="invite-role"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={invite} className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2" data-testid="invite-button">
            <Plus className="h-3.5 w-3.5" /> Invite
          </button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_120px_40px] gap-2 px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          <div>Member</div>
          <div>Role</div>
          <div>Status</div>
          <div>Last active</div>
          <div></div>
        </div>
        <div className="divide-y divide-border">
          {team.map((m) => (
            <div key={m.id} className="grid grid-cols-[1fr_120px_120px_120px_40px] gap-2 items-center px-4 py-2 hover:bg-accent/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#22C55E] grid place-items-center text-[11px] font-semibold">
                  {m.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate font-mono">{m.email}</div>
                </div>
              </div>
              <Select value={m.role} onValueChange={(v) => update(m.id, { role: v })}>
                <SelectTrigger className="h-8 bg-muted border-border text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="text-[11px] font-mono uppercase tracking-wider inline-flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", m.online ? "bg-[hsl(var(--success))]" : "bg-zinc-500")} />
                {m.online ? "Online" : "Offline"}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">{new Date(m.lastActive).toLocaleDateString()}</div>
              <button onClick={() => remove(m.id)} className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-md border border-border bg-card p-4 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-[hsl(var(--brand))] mt-0.5" />
        <div className="text-[12.5px] text-foreground/85">
          <div className="font-medium">Role permissions</div>
          <div className="text-muted-foreground mt-1">
            <span className="font-mono text-foreground/85">Owner</span> — full control. <span className="font-mono text-foreground/85">Admin</span> — manage workspace & members. <span className="font-mono text-foreground/85">Developer</span> — read/write collections. <span className="font-mono text-foreground/85">Viewer</span> — read-only.
          </div>
        </div>
      </div>
    </div>
  );
}
