import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  User as UserIcon,
  Palette,
  Sparkles,
  Bot,
  Moon,
  Sun,
  Loader2,
  MailWarning,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordMeter from "@/components/auth/PasswordMeter";
import { collectFieldErrors } from "@/lib/auth/toast";
import { getErrorMessage, useUpdatePassword, useUpdateProfile } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

const ACTIVE_TABS = [
  ["profile", "Profile", UserIcon],
  ["appearance", "Appearance", Palette],
  ["ai", "AI", Sparkles],
];

const TAB_TRIGGER_CLASS =
  "rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-[hsl(var(--brand))] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-[12.5px] text-muted-foreground inline-flex items-center gap-2";

export default function Settings() {
  const user = useAppStore((s) => s.user);
  const ai = useAppStore((s) => s.aiSettings);
  const setAi = useAppStore((s) => s.setAiSettings);
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  const profileDirty = useMemo(
    () => name.trim() !== (user?.name || "") || email.trim() !== (user?.email || ""),
    [name, email, user?.name, user?.email],
  );

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { name: name.trim(), email: email.trim() },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Profile saved.");
          if (!data.user?.email_verified && email.trim() !== user?.email) {
            toast.message("Verify your new email address.", {
              description: "We sent a verification code to your inbox.",
            });
          }
        },
        onError: (err) => toast.error(getErrorMessage(err, "Could not save profile.")),
      },
    );
  };

  const passwordDirty = Boolean(currentPassword || newPassword || confirmPassword);

  const handleChangePassword = () => {
    setPasswordErrors({});

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrors({ password_confirmation: "Passwords do not match." });
      return;
    }

    updatePassword.mutate(
      {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Password updated.");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setPasswordErrors({});
        },
        onError: (err) => {
          setPasswordErrors(
            collectFieldErrors(err, ["current_password", "password", "password_confirmation"]),
          );
          toast.error(getErrorMessage(err, "Could not update password."));
        },
      },
    );
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
          // preferences
        </div>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">Settings</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Manage your account, appearance, and AI preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex h-9 w-full justify-start gap-1 rounded-none border-b border-border bg-transparent px-0">
          {ACTIVE_TABS.map(([key, label, Icon]) => (
            <TabsTrigger key={key} value={key} className={TAB_TRIGGER_CLASS}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
          {/*
            Deferred tabs — re-enable when backed by real features:
            - Builder: builderSettings.autoSaveRequests (already in Zustand) — uncomment builder tab
            - Notifications: needs user notification prefs API or persisted store
            - Workspace: links to /team and workspace switcher; no per-user settings yet
            - Integrations: needs API keys / webhooks product surface
          */}
        </TabsList>

        <TabsContent value="profile" className="mt-5 max-w-5xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <SettingsCard title="Profile" description="Your name and sign-in email." className="h-full">
            <div className="space-y-4">
              <Field label="Full name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="bg-muted border-border h-9 text-[13px]"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-muted border-border h-9 text-[13px]"
                />
              </Field>
              {user && !user.emailVerified && (
                <div className="flex items-start gap-2 rounded-md border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/8 px-3 py-2.5 text-[12.5px]">
                  <MailWarning className="h-4 w-4 shrink-0 text-[hsl(var(--warning))] mt-0.5" />
                  <div>
                    <p className="text-foreground">Email not verified</p>
                    <p className="text-muted-foreground mt-0.5">
                      <Link to="/verify-email" className="text-[hsl(var(--brand))] hover:underline">
                        Verify your email
                      </Link>
                      {" "}to secure your account.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={!profileDirty || updateProfile.isPending}
                  className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {updateProfile.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {updateProfile.isPending ? "Saving…" : "Save changes"}
                </button>
                {profileDirty && !updateProfile.isPending && (
                  <span className="text-[12px] text-muted-foreground">Unsaved changes</span>
                )}
              </div>
            </div>
          </SettingsCard>

            <SettingsCard title="Password" description="Update the password you use to sign in." className="h-full">
            <div className="space-y-4">
              <Field label="Current password">
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className={cn(
                    "bg-muted border-border h-9 text-[13px]",
                    passwordErrors.current_password && "border-[hsl(var(--danger))]",
                  )}
                />
                {passwordErrors.current_password && (
                  <p className="mt-1 text-[12px] text-[hsl(var(--danger))]">{passwordErrors.current_password}</p>
                )}
              </Field>
              <Field label="New password">
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className={cn(
                    "bg-muted border-border h-9 text-[13px]",
                    passwordErrors.password && "border-[hsl(var(--danger))]",
                  )}
                />
                <PasswordMeter password={newPassword} className="mt-2" />
                {passwordErrors.password && (
                  <p className="mt-1 text-[12px] text-[hsl(var(--danger))]">{passwordErrors.password}</p>
                )}
              </Field>
              <Field label="Confirm new password">
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className={cn(
                    "bg-muted border-border h-9 text-[13px]",
                    passwordErrors.password_confirmation && "border-[hsl(var(--danger))]",
                  )}
                />
                {passwordErrors.password_confirmation && (
                  <p className="mt-1 text-[12px] text-[hsl(var(--danger))]">{passwordErrors.password_confirmation}</p>
                )}
              </Field>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={!passwordDirty || updatePassword.isPending}
                  className="h-9 px-3 rounded-md border border-border hover:bg-accent/50 text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {updatePassword.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {updatePassword.isPending ? "Updating…" : "Change password"}
                </button>
              </div>
            </div>
          </SettingsCard>
          </div>

          {user?.accountType && (
            <SettingsCard title="Account" description="Managed through onboarding.">
              <dl className="grid gap-2 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium capitalize">{user.accountType}</dd>
                </div>
                {user.company && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Organisation</dt>
                    <dd className="font-medium">{user.company}</dd>
                  </div>
                )}
              </dl>
            </SettingsCard>
          )}
        </TabsContent>

        <TabsContent value="appearance" className="mt-5 max-w-lg">
          <SettingsCard title="Theme" description="Choose how noidr looks on this device. Synced with the top bar toggle.">
            <div className="inline-flex border border-border rounded-md overflow-hidden">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={cn(
                    "h-9 px-4 text-[12.5px] inline-flex items-center gap-2 border-r border-border last:border-r-0",
                    theme === id
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="ai" className="mt-5 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <SettingsCard
            title="AI provider"
            description="Configure the model used in the AI sidebar. Changes save automatically in this browser."
            className="h-full"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Provider">
                <Select
                  value={ai.provider}
                  onValueChange={(v) => setAi({
                    provider: v,
                    ...(v === "ollama"
                      ? { model: "qwen2.5:3b", useOwnKey: false, baseUrl: "" }
                      : {}),
                    ...(v === "custom" && !ai.baseUrl
                      ? { baseUrl: "https://openrouter.ai/api/v1", useOwnKey: true }
                      : {}),
                    ...(v === "gemini" && ai.model === "qwen2.5:3b"
                      ? { model: "gemini-2.0-flash" }
                      : {}),
                  })}
                >
                  <SelectTrigger className="bg-muted border-border h-9 mt-1 text-[13px]" data-testid="ai-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="ollama">Ollama · Local</SelectItem>
                    <SelectItem value="gemini">Google · Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic · Claude</SelectItem>
                    <SelectItem value="custom">Custom · OpenAI-compatible</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Model">
                <Input
                  value={ai.model}
                  onChange={(e) => setAi({ model: e.target.value })}
                  placeholder={
                    ai.provider === "ollama" ? "qwen2.5:3b"
                      : ai.provider === "gemini" ? "gemini-2.0-flash"
                        : ai.provider === "openai" ? "gpt-4o-mini"
                          : ai.provider === "anthropic" ? "claude-3-5-sonnet-20241022"
                            : "provider/model-id"
                  }
                  data-testid="ai-model"
                  className="bg-muted border-border h-9 mt-1 font-mono text-[13px]"
                />
              </Field>
            </div>

            {ai.provider === "custom" && (
              <Field label="Base URL" className="mt-4">
                <Input
                  value={ai.baseUrl || ""}
                  onChange={(e) => setAi({ baseUrl: e.target.value })}
                  placeholder="https://openrouter.ai/api/v1"
                  data-testid="ai-base-url"
                  className="bg-muted border-border h-9 font-mono text-[13px]"
                />
                <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                  OpenRouter, Groq, Together, or any OpenAI-compatible chat completions API.
                </p>
              </Field>
            )}

            {ai.provider === "ollama" ? (
              <p className="mt-4 text-[12.5px] text-muted-foreground">
                Uses Ollama on the server — no API key required. Default model:{" "}
                <span className="font-mono text-foreground/85">qwen2.5:3b</span>.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
                  <Bot className="h-4 w-4 shrink-0 text-[hsl(var(--brand))]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">Use your own API key</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Required for cloud providers. Stored locally in your browser only.
                    </div>
                  </div>
                  <Switch
                    checked={ai.useOwnKey}
                    onCheckedChange={(v) => setAi({ useOwnKey: v })}
                    data-testid="ai-use-own-key"
                  />
                </div>
                {ai.useOwnKey && (
                  <Field label="API key">
                    <Input
                      type="password"
                      value={ai.userKey}
                      onChange={(e) => setAi({ userKey: e.target.value })}
                      placeholder="Paste your API key"
                      data-testid="ai-user-key"
                      className="bg-muted border-border h-9 font-mono text-[13px]"
                      autoComplete="off"
                    />
                  </Field>
                )}
              </div>
            )}
          </SettingsCard>

          <SettingsCard title="Free tier usage" description="Shared cloud quota when not using your own key." className="h-full">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-[hsl(var(--brand))] transition-[width]"
                    style={{ width: `${Math.min(100, (ai.usage.total / ai.usage.limit) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground font-mono uppercase tracking-wider" data-testid="ai-usage-meter">
                  {ai.usage.total} / {ai.usage.limit} requests this month
                </p>
              </div>
              <div className="text-right text-[12px] font-mono shrink-0">
                <div><span className="text-muted-foreground">build</span> · {ai.usage.build || 0}</div>
                <div><span className="text-muted-foreground">explain</span> · {ai.usage.explain || 0}</div>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              Enable <span className="text-foreground/85">Use your own API key</span> above to bypass the monthly cap.
            </p>
          </SettingsCard>
          </div>
        </TabsContent>

        {/*
        <TabsContent value="builder" className="mt-5 max-w-lg">
          ...
        </TabsContent>

        <TabsContent value="notifications" className="mt-5 max-w-lg">
          ...
        </TabsContent>

        <TabsContent value="workspace" className="mt-5 max-w-lg">
          ...
        </TabsContent>

        <TabsContent value="integrations" className="mt-5 max-w-2xl">
          ...
        </TabsContent>
        */}
      </Tabs>
    </div>
  );
}

function SettingsCard({ title, description, children, className }) {
  return (
    <div className={cn("rounded-md border border-border bg-card p-4", className)}>
      <div className="mb-4">
        <div className="text-[13px] font-medium">{title}</div>
        {description && (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <Label className="text-[11px] uppercase font-mono text-muted-foreground tracking-wider">
        {label}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
