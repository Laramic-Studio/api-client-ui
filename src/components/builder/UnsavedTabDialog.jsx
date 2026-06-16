import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UnsavedTabDialog({
  open,
  onOpenChange,
  isScratch,
  tabLabel,
  collections = [],
  collectionId,
  onCollectionChange,
  onSave,
  onDiscard,
  saving = false,
}) {
  const needsCollection = isScratch && collections.length > 1 && !collectionId;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Save changes?</AlertDialogTitle>
          <AlertDialogDescription>
            {isScratch
              ? `"${tabLabel || "Untitled"}" has unsaved changes. Save it to a collection before closing.`
              : `"${tabLabel || "Request"}" has unsaved changes.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isScratch && collections.length > 0 && (
          <div className="space-y-2">
            <div className="text-[12px] text-muted-foreground">Collection</div>
            <Select
              value={collectionId || collections[0]?.id || ""}
              onValueChange={onCollectionChange}
            >
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Choose collection" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="border-border" disabled={saving}>
            Cancel
          </AlertDialogCancel>
          <Button variant="outline" onClick={onDiscard} disabled={saving}>
            Don&apos;t save
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || needsCollection}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
