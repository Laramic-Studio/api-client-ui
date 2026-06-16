export default function WorkspaceNotice({ teamName, showCompanyNote }) {
  if (!teamName) return null;

  return (
    <div className="rounded-md border border-[hsl(var(--border))] bg-card px-3 py-2 text-[12.5px] text-muted-foreground">
      Your cloud workspace: <span className="text-foreground font-medium">{teamName}</span>
      {showCompanyNote && (
        <span className="block mt-1 text-[11.5px]">
          Company branding is saved locally for now. Shared company teams will be available in a future update.
        </span>
      )}
    </div>
  );
}
