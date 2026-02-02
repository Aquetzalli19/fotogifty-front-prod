"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ActiveToggleProps {
  isActive: boolean;
  onToggle: () => Promise<void>;
  disabled?: boolean;
  label?: string;
}

export function ActiveToggle({
  isActive,
  onToggle,
  disabled = false,
  label = "Activo",
}: ActiveToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onToggle();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={disabled || isLoading}
          aria-label={label}
        />
      )}
      <Label
        className={`text-sm cursor-pointer ${
          disabled ? "text-muted-foreground" : ""
        }`}
        onClick={disabled ? undefined : handleToggle}
      >
        {isActive ? "Visible" : "Oculto"}
      </Label>
    </div>
  );
}
