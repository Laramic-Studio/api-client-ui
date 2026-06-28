import { Check, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function AccessIndicator({ allowed, label }) {
  return (
    <div className="flex flex-col items-center gap-1" title={`${label}: ${allowed ? "allowed" : "not allowed"}`}>
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full border",
          allowed
            ? "border-[hsl(var(--brand))]/40 bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]"
            : "border-border bg-muted/40 text-muted-foreground",
        )}
        aria-label={`${label} ${allowed ? "allowed" : "not allowed"}`}
      >
        {allowed ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
        {label}
      </span>
    </div>
  );
}

function RoleAccessCell({ view, write, roleLabel }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <AccessIndicator allowed={view} label="View" />
      <AccessIndicator allowed={write} label="Write" />
      <span className="sr-only">{roleLabel}</span>
    </div>
  );
}

export default function TeamPrivileges({ privilegeMatrix }) {
  if (!privilegeMatrix?.modules?.length) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-[13px] text-muted-foreground">
        Could not load privilege matrix.
      </div>
    );
  }

  const { modules, roles, grants } = privilegeMatrix;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-medium">Role permissions reference</div>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            System defaults
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">
          This table shows what each role can do across workspace modules. These rules are fixed
          for every workspace — they are not editable here. To change what someone can do, assign
          them a different role on the <span className="font-medium text-foreground/85">All team</span> tab.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[220px] text-[10px] uppercase tracking-wider font-mono">
                Module
              </TableHead>
              {roles.map((role) => (
                <TableHead
                  key={role.value}
                  className="text-center text-[10px] uppercase tracking-wider font-mono"
                >
                  {role.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.key}>
                <TableCell className="align-top py-4">
                  <div className="font-medium text-[13px]">{module.label}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground max-w-xs">
                    {module.description}
                  </div>
                </TableCell>
                {roles.map((role) => {
                  const access = grants?.[module.key]?.[role.value] ?? { view: false, write: false };

                  return (
                    <TableCell key={role.value} className="text-center align-middle py-4">
                      <RoleAccessCell
                        view={access.view}
                        write={access.write}
                        roleLabel={`${role.label} access for ${module.label}`}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className={cn("text-[11.5px] text-muted-foreground")}>
        <span className="font-mono text-foreground/85">Owner</span> — full control.{" "}
        <span className="font-mono text-foreground/85">Admin</span> — manage workspace & members.{" "}
        <span className="font-mono text-foreground/85">Developer</span> — read/write collections.{" "}
        <span className="font-mono text-foreground/85">Viewer</span> — read-only.
      </p>
    </div>
  );
}
