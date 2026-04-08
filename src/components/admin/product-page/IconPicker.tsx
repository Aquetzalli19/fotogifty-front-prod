"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ICON_CATALOG, getIconByName } from "@/lib/icon-catalog";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string | null;
  onChange: (iconName: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Visual picker for Lucide icons. Renders the currently selected icon in the
 * trigger button, and opens a searchable grid of all icons from ICON_CATALOG.
 */
export function IconPicker({
  value,
  onChange,
  disabled,
  placeholder = "Seleccionar ícono",
  className,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const SelectedIcon = value ? getIconByName(value) : null;
  const selectedEntry = useMemo(
    () => ICON_CATALOG.find((e) => e.name === value) ?? null,
    [value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_CATALOG;
    return ICON_CATALOG.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.label.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between text-sm font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {SelectedIcon ? (
              <>
                <SelectedIcon className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">
                  {selectedEntry?.label ?? value}
                </span>
              </>
            ) : (
              placeholder
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Limpiar ícono"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(null);
                  }
                }}
                className="rounded p-0.5 hover:bg-muted cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ícono..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay íconos que coincidan con &quot;{query}&quot;
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-1">
              {filtered.map((entry) => {
                const Icon = entry.component;
                const isSelected = entry.name === value;
                return (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => handleSelect(entry.name)}
                    title={`${entry.label} (${entry.name})`}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 rounded-md p-2 hover:bg-muted transition-colors aspect-square",
                      isSelected && "bg-primary/10 ring-1 ring-primary"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    />
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">
                      {entry.label}
                    </span>
                    {isSelected && (
                      <Check className="absolute top-0.5 right-0.5 h-3 w-3 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t px-3 py-2 text-[10px] text-muted-foreground">
          {filtered.length} de {ICON_CATALOG.length} íconos disponibles
        </div>
      </PopoverContent>
    </Popover>
  );
}
