"use client";

import React, { useEffect, useState, useRef } from "react";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Minus, Plus } from "lucide-react";

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (value: number) => void;
  onLiveChange?: (value: number) => void; // Actualización en tiempo real
}

const SliderControl = ({
  label,
  value,
  min,
  max,
  step,
  onCommit,
  onLiveChange,
}: SliderControlProps) => {
  const [localValue, setLocalValue] = useState(value);
  const isDragging = useRef(false);

  useEffect(() => setLocalValue(value), [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "") {
      setLocalValue(0);
      return;
    }

    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, min), max);
      setLocalValue(clampedValue);
    }
  };

  const handleInputBlur = () => {
    onCommit(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onCommit(localValue);
    }
  };

  const handleIncrement = () => {
    const newValue = Math.min(localValue + step, max);
    setLocalValue(newValue);
    onCommit(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(localValue - step, min);
    setLocalValue(newValue);
    onCommit(newValue);
  };

  const handleSliderChange = ([v]: number[]) => {
    setLocalValue(v);
    // Si hay onLiveChange, llamarlo para actualización en tiempo real
    if (onLiveChange && isDragging.current) {
      onLiveChange(v);
    }
  };

  const handlePointerDown = () => {
    isDragging.current = true;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    // Al soltar, agregar al historial
    onCommit(localValue);
  };

  return (
    <div className="grid gap-2">
      <div className="flex justify-between items-center">
        <Label>
          {label}
        </Label>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={handleDecrement}
            aria-label="Decrease value"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="w-16">
            <Input
              type="number"
              value={localValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              min={min}
              max={max}
              step={step}
              className="w-full text-md font-medium h-8 text-center font-poppins px-2 p-0 bg-primary-foreground text-dark [-webkit-appearance:_none] [appearance:_none] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={handleIncrement}
            aria-label="Increase value"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Slider
        value={[localValue]}
        onValueChange={handleSliderChange}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};

export default SliderControl;
