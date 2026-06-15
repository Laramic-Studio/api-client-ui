import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Building2, User as UserIcon, Upload, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SIZES = ["Just me", "2-10", "11-50", "51-200", "201-1000", "1000+"];

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const complete = useAppStore((s) => s.completeOnboarding);
  const [type, setType] = useState("individual");
  const [companyName, setCompanyName] = useState("");
  const [size, setSize] = useState(SIZES[1]);
  const [logo, setLogo] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    if (user?.onboarded) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const onUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Choose an image");
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(f);
  };

  const submit = () => {
    if (type === "company" && !companyName.trim()) return toast.error("Add a company name");
    const company = type === "company" ? { name: companyName.trim(), size, logo } : null;
    complete({ accountType: type, company });
    toast.success("All set — welcome to Noidr");
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthShell
      title="Tell us about yourself"
      subtitle="This personalizes your workspace and branding."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "individual", label: "Individual", desc: "Just for me", icon: UserIcon },
            { id: "company",    label: "Company",    desc: "I represent a team", icon: Building2 },
          ].map((opt) => {
            const Ic = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id)}
                data-testid={`onboarding-type-${opt.id}`}
                className={cn(
                  "text-left rounded-md border p-4 transition-colors",
                  type === opt.id
                    ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/10"
                    : "border-[hsl(var(--border))] hover:bg-accent/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <Ic className="h-4 w-4" />
                  <div className="text-[13.5px] font-medium">{opt.label}</div>
                  {type === opt.id && <Check className="ml-auto h-3.5 w-3.5 text-[hsl(var(--brand))]" />}
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">{opt.desc}</div>
              </button>
            );
          })}
        </div>

        {type === "company" && (
          <div className="space-y-3 rounded-md border border-[hsl(var(--border))] bg-card p-4">
            <div>
              <Label className="text-[11px] uppercase font-mono text-muted-foreground">Company name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                data-testid="onboarding-company-name"
                className="bg-muted border-[hsl(var(--border))] h-10 font-mono text-[13px] mt-1"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase font-mono text-muted-foreground">Team size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="bg-muted border-[hsl(var(--border))] h-10 text-[13px] mt-1" data-testid="onboarding-company-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-[hsl(var(--border))]">
                  {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase font-mono text-muted-foreground">Logo (replaces brand in sidebar)</Label>
              <div className="mt-1 flex items-center gap-3">
                <div className="h-12 w-12 rounded-md border border-[hsl(var(--border))] bg-muted grid place-items-center overflow-hidden">
                  {logo ? <img src={logo} alt="logo" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-muted-foreground" />}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" data-testid="onboarding-logo-input" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-9 px-3 rounded-md border border-[hsl(var(--border))] hover:bg-accent/40 text-[12.5px] inline-flex items-center gap-2"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload logo
                </button>
                {logo && (
                  <button type="button" onClick={() => setLogo(null)} className="text-[12px] text-muted-foreground hover:text-foreground">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={submit}
          data-testid="onboarding-submit"
          className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white font-medium"
        >
          Finish setup
        </Button>
      </div>
    </AuthShell>
  );
}
