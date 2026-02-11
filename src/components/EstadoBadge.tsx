"use client";

import { Badge } from "@/components/ui/badge";

interface EstadoBadgeProps {
  nombre: string;
  color?: string;
  className?: string;
}

/**
 * Badge para mostrar estados de pedidos con color dinámico
 */
export function EstadoBadge({ nombre, color, className = "" }: EstadoBadgeProps) {
  // Color por defecto si no se proporciona
  const bgColor = color || "#9E9E9E";

  // Calcular color de texto basado en luminancia del fondo
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 158, g: 158, b: 158 }; // fallback a gris
  };

  const getLuminance = (hex: string) => {
    const rgb = hexToRgb(hex);
    // Fórmula de luminancia relativa (WCAG)
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  };

  const luminance = getLuminance(bgColor);
  const textColor = luminance > 0.5 ? "#000000" : "#FFFFFF";

  return (
    <Badge
      variant="outline"
      className={`border-none text-xs font-medium ${className}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {nombre}
    </Badge>
  );
}
