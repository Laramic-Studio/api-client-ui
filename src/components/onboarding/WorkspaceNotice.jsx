export default function WorkspaceNotice({ teamName }) {
  if (!teamName) return null;

  return (
    <div className="rounded-md border border-[hsl(var(--border))] bg-card px-3 py-2 text-[12.5px] text-muted-foreground">
      Your cloud workspace: <span className="text-foreground font-medium">{teamName}</span>
    </div>
  );
}
