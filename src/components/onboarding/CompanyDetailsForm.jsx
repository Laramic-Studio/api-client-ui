import { useRef } from "react";
import { Building2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TEAM_SIZES } from "@/components/onboarding/constants";
import { toast } from "sonner";

export default function CompanyDetailsForm({ companyName, size, logo, onChange }) {
  const fileRef = useRef(null);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image");

    const reader = new FileReader();
    reader.onload = () => onChange({ logo: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded-md border border-[hsl(var(--border))] bg-card p-4">
      <div>
        <Label className="text-[11px] uppercase font-mono text-muted-foreground">Company name</Label>
        <Input
          value={companyName}
          onChange={(e) => onChange({ companyName: e.target.value })}
          data-testid="onboarding-company-name"
          className="bg-muted border-[hsl(var(--border))] h-10 font-mono text-[13px] mt-1"
          placeholder="Acme Corp"
        />
      </div>

      <div>
        <Label className="text-[11px] uppercase font-mono text-muted-foreground">Team size</Label>
        <Select value={size} onValueChange={(next) => onChange({ size: next })}>
          <SelectTrigger
            className="bg-muted border-[hsl(var(--border))] h-10 text-[13px] mt-1"
            data-testid="onboarding-company-size"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-[hsl(var(--border))]">
            {TEAM_SIZES.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[11px] uppercase font-mono text-muted-foreground">
          Logo (replaces brand in sidebar)
        </Label>
        <div className="mt-1 flex items-center gap-3">
          <div className="h-12 w-12 rounded-md border border-[hsl(var(--border))] bg-muted grid place-items-center overflow-hidden">
            {logo
              ? <img src={logo} alt="logo" className="h-full w-full object-cover" />
              : <Building2 className="h-5 w-5 text-muted-foreground" />}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
            data-testid="onboarding-logo-input"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-9 px-3 rounded-md border border-[hsl(var(--border))] hover:bg-accent/40 text-[12.5px] inline-flex items-center gap-2"
          >
            <Upload className="h-3.5 w-3.5" /> Upload logo
          </button>
          {logo && (
            <button
              type="button"
              onClick={() => onChange({ logo: null })}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
