import { useState, useRef, useEffect, useCallback } from "react";
import { Transformations, Effect, Command } from "@/lib/types";

type CanvasStyle = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
};

export const useCanvasState = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [resolutionWarning, setResolutionWarning] = useState<string | null>(
    null
  );

  const [transformations, setTransformations] = useState<Transformations>({
    scale: 1,
    rotation: 0,
    mirrorX: false,
    mirrorY: false,
    posX: 0,
    posY: 0,
  });

  const [effects, setEffects] = useState<Effect[]>([
    { type: "brightness", value: 100 },
    { type: "contrast", value: 100 },
    { type: "saturate", value: 100 },
    { type: "sepia", value: 0 },
  ]);

  const [canvasStyle, setCanvasStyle] = useState<CanvasStyle>({
    backgroundColor: "#FFFFFF",
    borderColor: "#000000",
    borderWidth: 0,
  });

  const transformationsRef = useRef(transformations);
  const effectsRef = useRef(effects);
  const canvasStyleRef = useRef(canvasStyle);
  const selectedFilterRef = useRef(selectedFilter);

  useEffect(() => {
    transformationsRef.current = transformations;
    effectsRef.current = effects;
    canvasStyleRef.current = canvasStyle;
    selectedFilterRef.current = selectedFilter;
  }, [transformations, effects, canvasStyle, selectedFilter]);

  return {
    imageSrc,
    setImageSrc,
    selectedFilter,
    setSelectedFilter,
    resolutionWarning,
    setResolutionWarning,
    transformations,
    setTransformations,
    effects,
    setEffects,
    canvasStyle,
    setCanvasStyle,
    transformationsRef,
    effectsRef,
    canvasStyleRef,
    selectedFilterRef,
  };
};

// Hook to handle canvas transformations and effects
export const useCanvasOperations = (
  transformations: Transformations,
  setTransformations: React.Dispatch<React.SetStateAction<Transformations>>,
  effects: Effect[],
  setEffects: React.Dispatch<React.SetStateAction<Effect[]>>,
  canvasStyle: CanvasStyle,
  setCanvasStyle: React.Dispatch<React.SetStateAction<CanvasStyle>>,
  selectedFilter: string,
  setSelectedFilter: React.Dispatch<React.SetStateAction<string>>,
  execute: (command: Command) => void
) => {
  const createCommand = <T>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    oldValue: T,
    newValue: T
  ) => {
    const command: Command = {
      undo: () => setter(oldValue),
      redo: () => setter(newValue),
    };
    execute(command);
  };

  const handleTransformChange = (newValue: Transformations) => {
    createCommand(setTransformations, transformations, newValue);
  };

  const handleEffectChange = (newValue: Effect[]) => {
    createCommand(setEffects, effects, newValue);
  };

  const handleStyleChange = (newStyle: CanvasStyle) => {
    createCommand(setCanvasStyle, canvasStyle, newStyle);
  };

  const ensureEffectOrder = (effects: Effect[]): Effect[] => {
    const types: Effect["type"][] = [
      "brightness",
      "contrast",
      "saturate",
      "sepia",
    ];
    const result: Effect[] = [];

    for (const type of types) {
      const existing = effects.find((e) => e.type === type);
      if (existing) {
        result.push({ ...existing });
      } else {
        const defaultValue = type === "sepia" ? 0 : 100;
        result.push({ type, value: defaultValue });
      }
    }

    return result;
  };

  const handleEffectValueChange = (type: Effect["type"], value: number) => {
    const newEffects = [...effects];
    const existingIndex = newEffects.findIndex((e) => e.type === type);

    if (existingIndex !== -1) {
      newEffects[existingIndex] = { ...newEffects[existingIndex], value };
    } else {
      newEffects.push({ type, value });
    }

    // Ensure proper ordering for UI compatibility
    const orderedEffects = ensureEffectOrder(newEffects);
    handleEffectChange(orderedEffects);
  };

  const handleSaturationChange = (value: number) => {
    handleEffectValueChange("saturate", value);
  };

  const handleSepiaChange = (value: number) => {
    handleEffectValueChange("sepia", value);
  };

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);

    const newEffects = [...effects];
    if (filterId === "blackwhite") {
      const saturateIdx = newEffects.findIndex((e) => e.type === "saturate");
      if (saturateIdx !== -1) {
        newEffects[saturateIdx] = { ...newEffects[saturateIdx], value: 0 };
      } else {
        newEffects.push({ type: "saturate", value: 0 });
      }

      const sepiaIdx = newEffects.findIndex((e) => e.type === "sepia");
      if (sepiaIdx !== -1) {
        newEffects[sepiaIdx] = { ...newEffects[sepiaIdx], value: 0 };
      } else {
        newEffects.push({ type: "sepia", value: 0 });
      }
    } else if (filterId === "sepia") {
      const saturateIdx = newEffects.findIndex((e) => e.type === "saturate");
      if (saturateIdx !== -1) {
        newEffects[saturateIdx] = { ...newEffects[saturateIdx], value: 100 };
      } else {
        newEffects.push({ type: "saturate", value: 100 });
      }

      const sepiaIdx = newEffects.findIndex((e) => e.type === "sepia");
      if (sepiaIdx !== -1) {
        newEffects[sepiaIdx] = { ...newEffects[sepiaIdx], value: 100 };
      } else {
        newEffects.push({ type: "sepia", value: 100 });
      }
    } else if (filterId === "none") {
      const saturateIdx = newEffects.findIndex((e) => e.type === "saturate");
      if (saturateIdx !== -1) {
        newEffects[saturateIdx] = { ...newEffects[saturateIdx], value: 100 };
      } else {
        newEffects.push({ type: "saturate", value: 100 });
      }

      const sepiaIdx = newEffects.findIndex((e) => e.type === "sepia");
      if (sepiaIdx !== -1) {
        newEffects[sepiaIdx] = { ...newEffects[sepiaIdx], value: 0 };
      } else {
        newEffects.push({ type: "sepia", value: 0 });
      }
    }

    // Ensure proper ordering for UI compatibility
    const orderedEffects = ensureEffectOrder(newEffects);
    handleEffectChange(orderedEffects);
  };

  return {
    handleTransformChange,
    handleEffectChange,
    handleStyleChange,
    handleEffectValueChange,
    handleSaturationChange,
    handleSepiaChange,
    handleFilterSelect,
    ensureEffectOrder,
  };
};

// Hook to handle zoom functionality
export const useCanvasZoom = (initialZoom: number = 1) => {
  const [canvasZoom, setCanvasZoom] = useState(initialZoom);

  const handleZoomIn = () => {
    if (canvasZoom < 2) setCanvasZoom(canvasZoom + 0.1);
  };

  const handleZoomOut = () => {
    if (canvasZoom >= 0.2) setCanvasZoom(canvasZoom - 0.1);
  };

  const handleResetZoom = () => {
    setCanvasZoom(1);
  };

  return {
    canvasZoom,
    setCanvasZoom,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  };
};

export const useImageOperations = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setImageSrc: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedFilter: React.Dispatch<React.SetStateAction<string>>,
  setResolutionWarning: React.Dispatch<React.SetStateAction<string | null>>,
  handleTransformChange: (newTransformations: Transformations) => void,
  handleEffectChange: (newEffects: Effect[]) => void,
  handleStyleChange: (newStyle: CanvasStyle) => void,
  historyReset: () => void
) => {
  const handleClearImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setImageSrc(null);
    setSelectedFilter("none");
    setResolutionWarning(null);
    handleTransformChange({
      scale: 1,
      rotation: 0,
      mirrorX: false,
      mirrorY: false,
      posX: 0,
      posY: 0,
    });
    handleStyleChange({
      backgroundColor: "#FFFFFF",
      borderColor: "#000000",
      borderWidth: 0,
    });
    setTimeout(
      () =>
        handleEffectChange([
          { type: "brightness", value: 100 },
          { type: "contrast", value: 100 },
          { type: "saturate", value: 100 },
          { type: "sepia", value: 0 },
        ]),
      5
    );
    historyReset();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return {
    handleClearImage,
  };
};

// Hook to handle canvas dragging functionality
// Optimizado: usa eventos de document para permitir drag fuera del canvas
// y requestAnimationFrame para throttling del renderizado
// Soporta tanto mouse como touch para dispositivos móviles
export const useCanvasDragging = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  imageSrc: string | null,
  transformations: Transformations,
  canvasZoom: number,
  handleTransformChange: (newTransformations: Transformations) => void,
  setTransformationsDirectly?: React.Dispatch<React.SetStateAction<Transformations>>
) => {
  const [isDragging, setIsDragging] = useState(false);

  // Refs para evitar problemas de closures y para throttling
  const dragStartPos = useRef({ x: 0, y: 0 });
  const startTransformations = useRef<Transformations>(transformations);
  const isDraggingRef = useRef(false);
  const canvasZoomRef = useRef(canvasZoom);
  const rafPending = useRef(false); // Para throttling con rAF
  const lastDelta = useRef({ x: 0, y: 0 });
  const setTransformationsRef = useRef(setTransformationsDirectly);
  const handleTransformChangeRef = useRef(handleTransformChange);

  // Mantener refs actualizados
  useEffect(() => {
    canvasZoomRef.current = canvasZoom;
  }, [canvasZoom]);

  useEffect(() => {
    setTransformationsRef.current = setTransformationsDirectly;
    handleTransformChangeRef.current = handleTransformChange;
  }, [setTransformationsDirectly, handleTransformChange]);

  // Función común para manejar el movimiento (mouse o touch)
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    const deltaX = (clientX - dragStartPos.current.x) / canvasZoomRef.current;
    const deltaY = (clientY - dragStartPos.current.y) / canvasZoomRef.current;

    // Guardar el delta más reciente
    lastDelta.current = { x: deltaX, y: deltaY };

    // Throttle con requestAnimationFrame - solo actualizar si no hay un frame pendiente
    if (!rafPending.current && setTransformationsRef.current) {
      rafPending.current = true;
      requestAnimationFrame(() => {
        if (isDraggingRef.current && setTransformationsRef.current) {
          setTransformationsRef.current({
            ...startTransformations.current,
            posX: startTransformations.current.posX + lastDelta.current.x,
            posY: startTransformations.current.posY + lastDelta.current.y,
          });
        }
        rafPending.current = false;
      });
    }
  };

  // Función común para manejar el fin del arrastre (mouse o touch)
  const handleEnd = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    // Calcular delta final
    const deltaX = (clientX - dragStartPos.current.x) / canvasZoomRef.current;
    const deltaY = (clientY - dragStartPos.current.y) / canvasZoomRef.current;

    const finalTransformations = {
      ...startTransformations.current,
      posX: startTransformations.current.posX + deltaX,
      posY: startTransformations.current.posY + deltaY,
    };

    // Limpiar estado
    isDraggingRef.current = false;
    rafPending.current = false;
    setIsDragging(false);

    // Asegurar que la posición final esté aplicada
    if (setTransformationsRef.current) {
      setTransformationsRef.current(finalTransformations);
    }

    // Agregar al historial
    requestAnimationFrame(() => {
      handleTransformChangeRef.current(finalTransformations);
    });
  };

  // Registrar listeners globales una sola vez
  useEffect(() => {
    // Mouse events
    const handleDocumentMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleDocumentMouseUp = (e: MouseEvent) => {
      handleEnd(e.clientX, e.clientY);
    };

    // Touch events
    const handleDocumentTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      // Prevenir scroll mientras se arrastra
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleDocumentTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const touch = e.changedTouches[0];
      if (touch) {
        handleEnd(touch.clientX, touch.clientY);
      }
    };

    // Registrar eventos de mouse
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    // Registrar eventos táctiles con passive: false para poder prevenir scroll
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd);
    document.addEventListener('touchcancel', handleDocumentTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
      document.removeEventListener('touchcancel', handleDocumentTouchEnd);
    };
  }, []);

  // Función común para iniciar el arrastre
  const startDragging = useCallback((clientX: number, clientY: number) => {
    if (!imageSrc || !canvasRef.current) return;

    isDraggingRef.current = true;
    rafPending.current = false;
    setIsDragging(true);
    dragStartPos.current = { x: clientX, y: clientY };
    startTransformations.current = { ...transformations };
    lastDelta.current = { x: 0, y: 0 };
  }, [imageSrc, transformations]);

  // Registrar touchstart en el canvas con passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!imageSrc) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        startDragging(touch.clientX, touch.clientY);
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [imageSrc, startDragging]);

  // Handle mouse down on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    startDragging(e.clientX, e.clientY);
  };

  return {
    isDragging,
    handleCanvasMouseDown,
  };
};
