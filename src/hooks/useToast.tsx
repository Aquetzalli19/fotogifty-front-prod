"use client";

import { useState, useCallback } from "react";
import type { ToastType } from "@/components/ui/toast";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 4000) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: ToastItem = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove después del duration
      setTimeout(() => {
        removeToast(id);
      }, duration);

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "success", duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "error", duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "warning", duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "info", duration);
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
