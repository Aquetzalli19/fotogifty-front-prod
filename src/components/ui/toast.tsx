"use client";

import * as React from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-500",
    icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-500",
    icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-yellow-500",
    icon: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-500",
    icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  },
};

export function Toast({ message, type, onClose }: ToastProps) {
  const style = toastStyles[type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        "min-w-[300px] max-w-[500px]",
        style.bg,
        style.border
      )}
    >
      {style.icon}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}
