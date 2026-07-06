"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { Toast, ToastType } from "./types";

type ToastContextType = {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = "bg-zinc-950/80 border-white/10 text-white";
          let Icon = Info;
          let iconColor = "text-blue-400";

          switch (toast.type) {
            case "success":
              bgClass = "bg-zinc-900/90 border-emerald-500/20 text-emerald-100";
              Icon = CheckCircle2;
              iconColor = "text-emerald-400";
              break;
            case "error":
              bgClass = "bg-red-950/90 border-red-500/20 text-red-100";
              Icon = AlertCircle;
              iconColor = "text-red-400";
              break;
            case "warning":
              bgClass = "bg-amber-950/90 border-amber-500/20 text-amber-100";
              Icon = ShieldAlert;
              iconColor = "text-amber-400";
              break;
            case "info":
              bgClass = "bg-slate-900/90 border-cyan-500/20 text-cyan-100";
              Icon = Info;
              iconColor = "text-cyan-400";
              break;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in-right ${bgClass}`}
              role="alert"
            >
              <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-foreground/40 hover:text-foreground transition-colors p-0.5 rounded-lg hover:bg-white/5 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
