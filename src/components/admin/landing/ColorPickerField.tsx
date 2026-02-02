"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Pipette } from "lucide-react";
import { isValidHexColor } from "@/validations/landing-content-schema";

interface ColorPickerFieldProps {
  value: string | null;
  onChange: (color: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  allowAlpha?: boolean;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  "#E04F8B", // Pink (primary)
  "#47BEE5", // Cyan
  "#F5A524", // Amber (secondary)
  "#10B981", // Green
  "#6366F1", // Indigo
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F59E0B", // Orange
  "#000000", // Black
  "#FFFFFF", // White
  "#6B7280", // Gray
  "#1F2937", // Dark gray
];

export function ColorPickerField({
  value,
  onChange,
  label = "Color",
  placeholder = "#RRGGBB",
  disabled = false,
  allowAlpha = false,
}: ColorPickerFieldProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Sync input with prop value
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const validateAndUpdate = (newValue: string) => {
    if (!newValue) {
      setError(null);
      onChange(null);
      return;
    }

    // Auto-add # if missing
    let normalizedValue = newValue;
    if (!normalizedValue.startsWith("#")) {
      normalizedValue = "#" + normalizedValue;
    }

    // Convert to uppercase
    normalizedValue = normalizedValue.toUpperCase();

    if (isValidHexColor(normalizedValue)) {
      setError(null);
      onChange(normalizedValue);
    } else {
      setError(
        allowAlpha
          ? "Formato inválido. Use #RRGGBB o #RRGGBBAA"
          : "Formato inválido. Use #RRGGBB"
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError(null);
  };

  const handleInputBlur = () => {
    validateAndUpdate(inputValue);
  };

  const handlePresetClick = (color: string) => {
    setInputValue(color);
    setError(null);
    onChange(color);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue("");
    setError(null);
    onChange(null);
  };

  // Handle native color picker
  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value.toUpperCase();
    setInputValue(color);
    onChange(color);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      <div className="flex gap-2">
        {/* Color preview and picker */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-10 p-1 border-2"
              disabled={disabled}
              style={{
                backgroundColor: value && isValidHexColor(value) ? value : "transparent",
              }}
            >
              {(!value || !isValidHexColor(value)) && (
                <Pipette className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              {/* Preset colors grid */}
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 ${
                      value === color
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-muted"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handlePresetClick(color)}
                    title={color}
                  />
                ))}
              </div>

              {/* Native color picker */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">
                  Color personalizado:
                </Label>
                <input
                  type="color"
                  value={value && isValidHexColor(value) ? value : "#000000"}
                  onChange={handleNativeColorChange}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                  disabled={disabled}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Text input */}
        <div className="flex-1">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={error ? "border-destructive" : ""}
          />
        </div>

        {/* Clear button */}
        {value && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
