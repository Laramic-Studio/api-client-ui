import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MethodBadge from "@/components/shared/MethodBadge";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

function SearchableSelect({ value, onChange, options, placeholder, emptyText = "No results." }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 justify-between font-normal text-[12px] bg-background"
        >
          <span className="truncate">{selected?.label || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search…`} className="h-9 text-[12px]" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.search || option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="text-[12px]"
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ImportFromCollection({ collections, onImport }) {
  const [collectionId, setCollectionId] = useState(collections[0]?.id || "");
  const [requestId, setRequestId] = useState("");

  const collection = collections.find((c) => c.id === collectionId);
  const requests = collection?.requests || [];

  const collectionOptions = useMemo(
    () => collections.map((c) => ({
      value: c.id,
      label: c.name,
      search: c.name,
    })),
    [collections],
  );

  const requestOptions = useMemo(
    () => requests.map((r) => ({
      value: r.id,
      label: `${r.method} · ${r.name}`,
      search: `${r.method} ${r.name} ${r.url || ""}`,
    })),
    [requests],
  );

  const quickPicks = requests.slice(0, 6);

  const handleImportSelected = () => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;
    onImport(request);
    setRequestId("");
  };

  if (collections.length === 0) {
    return (
      <div className="text-[12px] text-muted-foreground">
        No collections yet. Create requests in the API Builder first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom">
        Import from collection
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <SearchableSelect
          value={collectionId}
          onChange={(id) => {
            setCollectionId(id);
            setRequestId("");
          }}
          options={collectionOptions}
          placeholder="Select collection"
          emptyText="No collections found."
        />
        <SearchableSelect
          value={requestId}
          onChange={setRequestId}
          options={requestOptions}
          placeholder={requests.length ? "Select request" : "No requests in collection"}
          emptyText="No requests found."
        />
        <Button
          type="button"
          size="sm"
          className="h-9"
          disabled={!requestId}
          onClick={handleImportSelected}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add step
        </Button>
      </div>

      {quickPicks.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground mb-1.5">Quick add from {collection?.name}</div>
          <div className="flex flex-wrap gap-1.5">
            {quickPicks.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onImport(r)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border hover:bg-accent/50 text-[11px]"
              >
                <MethodBadge method={r.method} />
                <span className="truncate max-w-[140px]">{r.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
