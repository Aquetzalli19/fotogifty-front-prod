import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lista de países con sus códigos y longitudes de teléfono
export const COUNTRIES = [
  { code: "+52", name: "México", flag: "🇲🇽", digitLimit: 10 },
  { code: "+1", name: "Estados Unidos", flag: "🇺🇸", digitLimit: 10 },
  { code: "+1", name: "Canadá", flag: "🇨🇦", digitLimit: 10 },
  { code: "+34", name: "España", flag: "🇪🇸", digitLimit: 9 },
  { code: "+54", name: "Argentina", flag: "🇦🇷", digitLimit: 10 },
  { code: "+56", name: "Chile", flag: "🇨🇱", digitLimit: 9 },
  { code: "+57", name: "Colombia", flag: "🇨🇴", digitLimit: 10 },
  { code: "+51", name: "Perú", flag: "🇵🇪", digitLimit: 9 },
  { code: "+58", name: "Venezuela", flag: "🇻🇪", digitLimit: 10 },
  { code: "+55", name: "Brasil", flag: "🇧🇷", digitLimit: 11 },
] as const;

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onValueChange: (value: string) => void;
  onCountryChange: (code: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      countryCode,
      onValueChange,
      onCountryChange,
      className,
      placeholder = "5512345678",
      disabled,
    },
    ref
  ) => {
    const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^0-9]/g, "");

      // Limitar según el país seleccionado
      const limitedValue = inputValue.slice(0, selectedCountry.digitLimit);

      onValueChange(limitedValue);
    };

    return (
      <div className="flex gap-2">
        {/* Selector de país */}
        <Select value={countryCode} onValueChange={onCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[140px] h-11 md:h-12">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.code}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code + country.name} value={country.code}>
                <span className="flex items-center gap-2">
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm">{country.code}</span>
                  <span className="text-sm text-muted-foreground">{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Input de número */}
        <div className="relative flex-1">
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={handleInput}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex h-11 md:h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          />
          {/* Contador de dígitos */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {value.length}/{selectedCountry.digitLimit}
          </div>
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
