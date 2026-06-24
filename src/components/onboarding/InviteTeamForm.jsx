import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const INVITE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "developer", label: "Developer" },
  { value: "viewer", label: "Viewer" },
];

function emptyInvite() {
  return { email: "", role: "developer" };
}

export default function InviteTeamForm({ invites, onChange }) {
  const rows = invites.length ? invites : [emptyInvite()];

  const updateRow = (index, patch) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => {
    if (rows.length >= 10) return;
    onChange([...rows, emptyInvite()]);
  };

  const removeRow = (index) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length ? next : [emptyInvite()]);
  };

  return (
    <div className="space-y-3">
      <Label className="text-[11px] uppercase font-mono text-muted-foreground">
        Invite teammates (optional)
      </Label>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="email"
              value={row.email}
              onChange={(e) => updateRow(index, { email: e.target.value })}
              placeholder="colleague@company.com"
              data-testid={`onboarding-invite-email-${index}`}
              className="bg-muted border-[hsl(var(--border))] h-10 font-mono text-[13px] flex-1"
            />
            <Select value={row.role} onValueChange={(role) => updateRow(index, { role })}>
              <SelectTrigger className="bg-muted border-[hsl(var(--border))] h-10 text-[13px] w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-[hsl(var(--border))]">
                {INVITE_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="h-10 w-10 shrink-0 rounded-md border border-[hsl(var(--border))] hover:bg-accent/40 grid place-items-center"
                aria-label="Remove invite"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {rows.length < 10 && (
        <button
          type="button"
          onClick={addRow}
          className="text-[12.5px] text-[hsl(var(--brand))] hover:underline inline-flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add another
        </button>
      )}
    </div>
  );
}
