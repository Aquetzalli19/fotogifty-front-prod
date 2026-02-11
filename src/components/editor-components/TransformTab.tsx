import React, { useState } from "react";
import SliderControl from "../SliderControl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, RotateCw, RectangleVertical, RectangleHorizontal } from "lucide-react";

interface TransfromTabProps {
  scale: number;
  rotation: number;
  posX: number;
  posY: number;
  onScaleChange: (value: number) => void;
  onRotationChange: (value: number) => void;
  onPosXChange: (value: number) => void;
  onPosYChange: (value: number) => void;
  // Callbacks para actualización en tiempo real (sin agregar al historial)
  onScaleLive?: (value: number) => void;
  onRotationLive?: (value: number) => void;
  onPosXLive?: (value: number) => void;
  onPosYLive?: (value: number) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  // Control de orientación del canvas (opcional)
  canvasOrientation?: "portrait" | "landscape";
  onCanvasOrientationChange?: (orientation: "portrait" | "landscape") => void;
}

const TransformTab = ({
  scale,
  rotation,
  posX,
  posY,
  onScaleChange,
  onRotationChange,
  onPosXChange,
  onPosYChange,
  onScaleLive,
  onRotationLive,
  onPosXLive,
  onPosYLive,
  canvasWidth = 768,
  canvasHeight = 576,
  canvasOrientation,
  onCanvasOrientationChange,
}: TransfromTabProps) => {
  // Calcular rangos de posición basados en el tamaño del canvas
  const posXRange = Math.round(canvasWidth * 0.6);
  const posYRange = Math.round(canvasHeight * 0.6);

  // Estado local para el input de rotación
  const [rotationInput, setRotationInput] = useState(rotation.toString());

  // Actualizar input cuando cambia la rotación desde los botones o externamente
  React.useEffect(() => {
    setRotationInput(rotation.toString());
  }, [rotation]);

  // Función para rotar -90 grados
  const handleRotateLeft = () => {
    const newRotation = rotation - 90;
    // Normalizar entre -180 y 180
    const normalized = ((newRotation + 180) % 360) - 180;
    onRotationChange(normalized);
  };

  // Función para rotar +90 grados
  const handleRotateRight = () => {
    const newRotation = rotation + 90;
    // Normalizar entre -180 y 180
    const normalized = ((newRotation + 180) % 360) - 180;
    onRotationChange(normalized);
  };

  // Manejar cambio en el input numérico
  const handleRotationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRotationInput(value);

    // Validar y aplicar solo si es un número válido
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Normalizar entre -180 y 180
      let normalized = numValue % 360;
      if (normalized > 180) normalized -= 360;
      if (normalized < -180) normalized += 360;

      // Actualizar en tiempo real (live change)
      if (onRotationLive) {
        onRotationLive(normalized);
      }
    }
  };

  // Aplicar rotación al perder foco o presionar Enter
  const handleRotationInputBlur = () => {
    const numValue = parseFloat(rotationInput);
    if (!isNaN(numValue)) {
      // Normalizar entre -180 y 180
      let normalized = numValue % 360;
      if (normalized > 180) normalized -= 360;
      if (normalized < -180) normalized += 360;

      onRotationChange(normalized);
    } else {
      // Revertir al valor actual si el input es inválido
      setRotationInput(rotation.toString());
    }
  };

  const handleRotationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRotationInputBlur();
    }
  };

  return (
    <div className="space-y-4 h-fit">
      {/* Orientación del Canvas - Solo mostrar si se proporciona el callback */}
      {canvasOrientation && onCanvasOrientationChange && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Orientación del Canvas</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={canvasOrientation === "portrait" ? "default" : "outline"}
              size="sm"
              onClick={() => onCanvasOrientationChange("portrait")}
              className="flex-1 flex items-center justify-center gap-2"
              title="Orientación vertical (portrait)"
            >
              <RectangleVertical className="h-4 w-4" />
              <span className="hidden sm:inline">Vertical</span>
            </Button>
            <Button
              type="button"
              variant={canvasOrientation === "landscape" ? "default" : "outline"}
              size="sm"
              onClick={() => onCanvasOrientationChange("landscape")}
              className="flex-1 flex items-center justify-center gap-2"
              title="Orientación horizontal (landscape)"
            >
              <RectangleHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Horizontal</span>
            </Button>
          </div>
          <p className="text-xs text-foreground/70">
            Cambia la orientación de todo el lienzo de impresión
          </p>
        </div>
      )}

      {/* Escala */}
      <SliderControl
        label="Escala"
        value={scale}
        min={0.1}
        max={3}
        step={0.05}
        onCommit={onScaleChange}
        onLiveChange={onScaleLive}
      />

      {/* Rotación de imagen */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Rotación de Imagen</label>

        {/* Botones de rotación rápida y input numérico */}
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRotateLeft}
            className="flex-1"
            title="Rotar 90° a la izquierda"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            -90°
          </Button>

          <div className="flex items-center gap-1 flex-1">
            <Input
              type="number"
              value={rotationInput}
              onChange={handleRotationInputChange}
              onBlur={handleRotationInputBlur}
              onKeyDown={handleRotationInputKeyDown}
              className="h-8 text-center text-sm"
              placeholder="Grados"
              step="1"
              min="-180"
              max="180"
            />
            <span className="text-xs text-foreground/70">°</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRotateRight}
            className="flex-1"
            title="Rotar 90° a la derecha"
          >
            <RotateCw className="h-4 w-4 mr-1" />
            +90°
          </Button>
        </div>

        <p className="text-xs text-foreground/70">
          Rota solo la imagen dentro del canvas
        </p>
      </div>

      {/* Posición X */}
      <SliderControl
        label="Posición X"
        value={posX}
        min={-posXRange}
        max={posXRange}
        step={1}
        onCommit={onPosXChange}
        onLiveChange={onPosXLive}
      />

      {/* Posición Y */}
      <SliderControl
        label="Posición Y"
        value={posY}
        min={-posYRange}
        max={posYRange}
        step={1}
        onCommit={onPosYChange}
        onLiveChange={onPosYLive}
      />
    </div>
  );
};

export default TransformTab;
