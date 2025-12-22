import React from "react";
import SliderControl from "../SliderControl";

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
}: TransfromTabProps) => {
  // Calcular rangos de posición basados en el tamaño del canvas
  const posXRange = Math.round(canvasWidth * 0.6);
  const posYRange = Math.round(canvasHeight * 0.6);

  return (
    <div className="space-y-4 h-fit">
      <SliderControl
        label="Escala"
        value={scale}
        min={0.1}
        max={3}
        step={0.05}
        onCommit={onScaleChange}
        onLiveChange={onScaleLive}
      />
      <SliderControl
        label="Rotación"
        value={rotation}
        min={-180}
        max={180}
        step={1}
        onCommit={onRotationChange}
        onLiveChange={onRotationLive}
      />
      <SliderControl
        label="Posición X"
        value={posX}
        min={-posXRange}
        max={posXRange}
        step={1}
        onCommit={onPosXChange}
        onLiveChange={onPosXLive}
      />
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
