import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export default function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  onConfirm,
  isDeleting,
}) {
  const [confirmName, setConfirmName] = useState("");

  const handleOpenChange = (next) => {
    if (!next) setConfirmName("");
    onOpenChange(next);
  };

  const canDelete = confirmName === workspace?.name;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete workspace</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes <span className="font-medium text-foreground">{workspace?.name}</span> and its cloud data.
            Type the workspace name to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder={workspace?.name}
          className="bg-muted border-border"
          data-testid="delete-workspace-confirm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete || isDeleting}
            onClick={(e) => {
              e.preventDefault();
              onConfirm(workspace.name);
            }}
            className="bg-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/90"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
