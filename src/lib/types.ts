export type Transformations = {
  scale: number;
  rotation: number;
  mirrorX: boolean;
  mirrorY: boolean;
  posX: number;
  posY: number;
};

export type Effect = {
  type: "brightness" | "contrast" | "saturate" | "sepia";
  value: number;
};

export type Command = {
  undo: () => void;
  redo: () => void;
};

export type CanvasStyle = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
};
