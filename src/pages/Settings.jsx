import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plug, KeyRound, Bell, Briefcase, User as UserIcon, Palette, Sparkles, Bot } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const user = useAppStore((s) => s.user);
  const ai = useAppStore((s) => s.aiSettings);
  const setAi = useAppStore((s) => s.setAiSettings);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifReq, setNotifReq] = useState(true);
  const [notifTest, setNotifTest] = useState(true);
  const [notifMock, setNotifMock] = useState(false);
  const [density, setDensity] = useState("comfortable");

  return (
    <div className="h-full overflow-auto p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// preferences</div>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-transparent border-b border-border rounded-none h-9 px-0 justify-start gap-1">
          {[
            ["profile", "Profile", UserIcon],
            ["appearance", "Appearance", Palette],
            ["ai", "AI", Sparkles],
            ["notifications", "Notifications", Bell],
            ["workspace", "Workspace", Briefcase],
            ["integrations", "Integrations", Plug],
          ].map(([k, l, Ic]) => (
            <TabsTrigger
              key={k}
              value={k}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--brand))] rounded-none h-9 px-3 text-[12.5px] text-muted-foreground inline-flex items-center gap-2"
            >
              <Ic className="h-3.5 w-3.5" /> {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-4 max-w-md">
          <Card>
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] uppercase font-mono text-muted-foreground">Full name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted border-border h-9 font-mono text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] uppercase font-mono text-muted-foreground">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted border-border h-9 font-mono text-[13px]" />
              </div>
              <button onClick={() => toast.success("Profile saved")} className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium">
                Save changes
              </button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 space-y-4 max-w-md">
          <Card>
            <div className="space-y-4">
              <Row label="Theme" hint="Use the toggle in the top bar to switch dark/light." />
              <Row label="Density">
                <div className="inline-flex border border-border rounded-md overflow-hidden">
                  {["compact", "comfortable", "spacious"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      className={`h-8 px-3 text-[12px] capitalize ${density === d ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="Font">
                <span className="font-mono text-[12.5px] text-foreground/85">Geist + JetBrains Mono</span>
              </Row>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-4 max-w-md">
          <Card>
            <Row label="Request completed" hint="Toast when a request finishes.">
              <Switch checked={notifReq} onCheckedChange={setNotifReq} />
            </Row>
            <Row label="Tests passed/failed" hint="Highlight test outcomes.">
              <Switch checked={notifTest} onCheckedChange={setNotifTest} />
            </Row>
            <Row label="Mock server created" hint="Notify when a mock endpoint is added.">
              <Switch checked={notifMock} onCheckedChange={setNotifMock} />
            </Row>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6 space-y-4 max-w-xl">
          <Card>
            <div className="flex items-center gap-3">
              <Bot className="h-4 w-4 text-[hsl(var(--brand))]" />
              <div className="flex-1">
                <div className="text-[13.5px] font-medium">Use your own API key</div>
                <div className="text-[11.5px] text-muted-foreground">Bypass the free tier. Keys are stored locally and sent only with AI calls.</div>
              </div>
              <Switch
                checked={ai.useOwnKey}
                onCheckedChange={(v) => setAi({ useOwnKey: v })}
                data-testid="ai-use-own-key"
              />
            </div>
            {ai.useOwnKey && (
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-mono text-muted-foreground">API key</Label>
                <Input
                  type="password"
                  value={ai.userKey}
                  onChange={(e) => setAi({ userKey: e.target.value })}
                  placeholder="sk-…"
                  data-testid="ai-user-key"
                  className="bg-muted border-border h-9 font-mono text-[13px]"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] uppercase font-mono text-muted-foreground">Provider</Label>
                <Select value={ai.provider} onValueChange={(v) => setAi({ provider: v })}>
                  <SelectTrigger className="bg-muted border-border h-9 mt-1 text-[13px]" data-testid="ai-provider"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="gemini">Google · Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic · Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase font-mono text-muted-foreground">Model</Label>
                <Input
                  value={ai.model}
                  onChange={(e) => setAi({ model: e.target.value })}
                  placeholder="gemini-3-flash-preview"
                  data-testid="ai-model"
                  className="bg-muted border-border h-9 mt-1 font-mono text-[13px]"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] uppercase font-mono text-muted-foreground mb-2">Free tier usage</div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-[hsl(var(--brand))]"
                    style={{ width: `${Math.min(100, (ai.usage.total / ai.usage.limit) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground font-mono uppercase tracking-wider" data-testid="ai-usage-meter">
                  {ai.usage.total} / {ai.usage.limit} requests this month
                </div>
              </div>
              <div className="text-right text-[12px] font-mono">
                <div><span className="text-muted-foreground">build</span> · {ai.usage.build || 0}</div>
                <div><span className="text-muted-foreground">explain</span> · {ai.usage.explain || 0}</div>
              </div>
            </div>
            <div className="text-[11.5px] text-muted-foreground">
              Need more? Toggle <span className="text-foreground/80">Use your own API key</span> above to remove the cap.
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="mt-6 space-y-4 max-w-md">
          <Card>
            <div className="text-[12.5px] text-foreground/85 leading-relaxed">
              Workspace name, member roles, and default environment variables are managed in the <a href="/workspaces" className="text-[hsl(var(--brand))] hover:underline">Workspaces</a> screen.
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-3">
          <Card>
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-[hsl(var(--brand))]" />
              <div className="flex-1">
                <div className="text-[13.5px] font-medium">Personal API key</div>
                <div className="text-[11.5px] text-muted-foreground font-mono">noidr_pk_••••••••••••••5f3a</div>
              </div>
              <button onClick={() => toast.success("Key rotated")} className="h-8 px-2.5 rounded-md border border-border hover:bg-accent/50 text-[12.5px]">Rotate</button>
            </div>
          </Card>
          {[
            "Slack — Test results to #api",
            "GitHub — Sync collections to repo",
            "Stripe Sandbox — Mock financial endpoints",
            "Sentry — Error reporting",
          ].map((n) => (
            <Card key={n}>
              <div className="flex items-center">
                <div className="text-[13px]">{n}</div>
                <button onClick={() => toast.success(`${n.split(" — ")[0]} connected (mock)`)} className="ml-auto h-8 px-2.5 rounded-md border border-border hover:bg-accent/50 text-[12.5px]">
                  Connect
                </button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ children }) {
  return <div className="rounded-md border border-border bg-card p-4 space-y-3">{children}</div>;
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="text-[13px] text-foreground/90">{label}</div>
        {hint && <div className="text-[11.5px] text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
