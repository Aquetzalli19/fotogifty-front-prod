"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Package as PackageIcon, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { obtenerTodosPaquetes, type Paquete } from "@/services/packages";
import { cn } from "@/lib/utils";

interface PackageSelectorProps {
  value: number | null | undefined;
  onChange: (paqueteId: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Dropdown selector for picking a paquete to link to. Used by slides in the
 * `product_types` section so each card can redirect to a specific package.
 */
export function PackageSelector({
  value,
  onChange,
  disabled,
  placeholder = "Sin enlace — selecciona un paquete",
}: PackageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Paquete[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await obtenerTodosPaquetes();
        if (!cancelled && res.success && res.data) {
          setPackages(res.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => (value ? packages.find((p) => p.id === value) : null),
    [value, packages]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter((p) => {
      const nombre = (p.nombre || "").toLowerCase();
      const categoria = (p.categoria_nombre || "").toLowerCase();
      return nombre.includes(q) || categoria.includes(q);
    });
  }, [query, packages]);

  const handleSelect = (id: number) => {
    onChange(id);
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
            !value && "text-muted-foreground"
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <PackageIcon className="h-4 w-4 shrink-0 text-primary" />
            {selected ? (
              <span className="truncate">
                {selected.nombre}
                {selected.categoria_nombre && (
                  <span className="text-muted-foreground ml-1">
                    · {selected.categoria_nombre}
                  </span>
                )}
              </span>
            ) : value && !selected && !loading ? (
              <span>Paquete #{value}</span>
            ) : (
              placeholder
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Quitar enlace"
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
      <PopoverContent className="w-[360px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paquete o categoría..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Cargando paquetes...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {query
                ? `No hay paquetes que coincidan con "${query}"`
                : "No hay paquetes disponibles"}
            </p>
          ) : (
            <div className="py-1">
              {filtered.map((p) => {
                const isSelected = p.id === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <PackageIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.nombre}</p>
                      {p.categoria_nombre && (
                        <p className="text-xs text-muted-foreground truncate">
                          {p.categoria_nombre}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t px-3 py-2 text-[10px] text-muted-foreground">
          {loading
            ? "Cargando..."
            : `${filtered.length} de ${packages.length} paquetes`}
        </div>
      </PopoverContent>
    </Popover>
  );
}
