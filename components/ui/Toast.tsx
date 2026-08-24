"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaCheck, FaXmark, FaInfo } from "react-icons/fa6";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = "success" | "error" | "info";

export type ToastOptions = {
  message: string;
  type?: ToastType;
  duration?: number;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type ToastEntry = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (options: ToastOptions | string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * Show a toast notification from anywhere in the app.
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type ToastProviderProps = {
  children: React.ReactNode;
  /** Maximum number of toasts to show at once (defaults to 3). */
  maxToasts?: number;
  /** Default duration in ms before auto-dismiss (defaults to 3000). */
  duration?: number;
};

/**
 * Provider that manages a queue of toast notifications.
 *
 * Renders toasts in a fixed position (top-right) with automatic dismissal.
 */
export function ToastProvider({
  children,
  maxToasts = 3,
  duration = 3000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((options: ToastOptions | string) => {
    const entry: ToastEntry = {
      id: `toast-${++counterRef.current}-${Date.now()}`,
      message: typeof options === "string" ? options : options.message,
      type: typeof options === "string" ? "info" : options.type ?? "info",
    };

    setToasts((prev) => {
      const updated = [...prev, entry];
      // Keep only the most recent `maxToasts` toasts.
      return updated.slice(-maxToasts);
    });
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed right-4 top-4 z-[100] flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            duration={duration}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Toast Item
// ---------------------------------------------------------------------------

type ToastItemProps = {
  toast: ToastEntry;
  duration: number;
  onDismiss: (id: string) => void;
};

/**
 * Individual toast notification with auto-dismiss and manual close.
 */
function ToastItem({ toast, duration, onDismiss }: ToastItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, duration, onDismiss]);

  const icons = {
    success: <FaCheck className="text-sm text-green-600" aria-hidden="true" />,
    error: <FaXmark className="text-sm text-red-600" aria-hidden="true" />,
    info: <FaInfo className="text-sm text-blue-600" aria-hidden="true" />,
  };

  const borders = {
    success: "border-green-500",
    error: "border-red-500",
    info: "border-blue-500",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border-l-4 bg-white px-4 py-3 shadow-lg ${borders[toast.type]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-medium text-neutral-800">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-1 text-neutral-400 transition hover:text-neutral-600"
        aria-label="Dismiss notification"
      >
        <FaXmark className="text-xs" aria-hidden="true" />
      </button>
    </div>
  );
}
