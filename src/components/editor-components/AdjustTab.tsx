import React, { useState } from "react";
import SliderControl from "../SliderControl";
import FilterPreview from "./FilterPreview";

interface AdjustTabProps {
  imageSrc: string | null;
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  selectedFilter: string;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  onSepiaChange: (value: number) => void;
  onFilterSelect: (filter: string) => void;
  // Callbacks para actualización en tiempo real
  onBrightnessLive?: (value: number) => void;
  onContrastLive?: (value: number) => void;
  onSaturationLive?: (value: number) => void;
  onSepiaLive?: (value: number) => void;
}

const AdjustTab = ({
  imageSrc,
  brightness,
  contrast,
  saturation,
  sepia,
  selectedFilter,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onSepiaChange,
  onFilterSelect,
  onBrightnessLive,
  onContrastLive,
  onSaturationLive,
  onSepiaLive,
}: AdjustTabProps) => {
  const [filters] = useState([
    { id: "none", name: "Original" },
    { id: "blackwhite", name: "B/N" },
    { id: "sepia", name: "Sepia" },
  ]);

  return (
    <div className="space-y-4 px-2">
      <FilterPreview
        imageSrc={imageSrc || ""}
        selectedFilter={selectedFilter}
        onFilterSelect={onFilterSelect}
        filters={filters}
      />

      <SliderControl
        label="Brillo"
        value={brightness}
        min={0}
        max={200}
        step={1}
        onCommit={onBrightnessChange}
        onLiveChange={onBrightnessLive}
      />
      <SliderControl
        label="Contraste"
        value={contrast}
        min={0}
        max={200}
        step={1}
        onCommit={onContrastChange}
        onLiveChange={onContrastLive}
      />
      <SliderControl
        label="Saturación"
        value={saturation}
        min={0}
        max={200}
        step={1}
        onCommit={onSaturationChange}
        onLiveChange={onSaturationLive}
      />
      <SliderControl
        label="Sepia"
        value={sepia}
        min={0}
        max={100}
        step={1}
        onCommit={onSepiaChange}
        onLiveChange={onSepiaLive}
      />
    </div>
  );
};

export default AdjustTab;
