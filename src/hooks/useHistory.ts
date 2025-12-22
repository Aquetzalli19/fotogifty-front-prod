import { useState, useCallback } from "react";
import { Command } from "@/lib/types";

export const useHistory = () => {
  const [history, setHistory] = useState<Command[]>([]);
  const [index, setIndex] = useState<number>(-1);

  const execute = useCallback(
    (command: Command) => {
      const newHistory = history.slice(0, index + 1);

      setHistory([...newHistory, command]);
      setIndex(newHistory.length);

      command.redo();
    },
    [history, index]
  );

  const canUndo = index >= 0;
  const canRedo = index < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      history[index].undo();
      setIndex(index - 1);
    }
  }, [canUndo, history, index]);

  const redo = useCallback(() => {
    if (canRedo) {
      history[index + 1].redo();
      setIndex(index + 1);
    }
  }, [canRedo, history, index]);

  const reset = useCallback(() => {
    setHistory([]);
    setIndex(-1);
  }, []);

  return { execute, undo, redo, canUndo, canRedo, reset };
};
