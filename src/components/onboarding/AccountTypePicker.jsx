import { Building2, User as UserIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES } from "@/components/onboarding/constants";

const ICONS = {
  user: UserIcon,
  building: Building2,
};

export default function AccountTypePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ACCOUNT_TYPES.map((opt) => {
        const Icon = ICONS[opt.icon];
        const selected = value === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            data-testid={`onboarding-type-${opt.id}`}
            className={cn(
              "text-left rounded-md border p-4 transition-colors",
              selected
                ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/10"
                : "border-[hsl(var(--border))] hover:bg-accent/30"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <div className="text-[13.5px] font-medium">{opt.label}</div>
              {selected && <Check className="ml-auto h-3.5 w-3.5 text-[hsl(var(--brand))]" />}
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
