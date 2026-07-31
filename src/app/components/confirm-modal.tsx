"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? "bg-black/60 backdrop-blur-sm" : "bg-transparent pointer-events-none"
      }`}
      onClick={!isLoading ? onCancel : undefined}
    >
      <div
        className={`bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-2xl shadow-2xl max-w-sm w-full p-6 transition-all duration-300 transform ${
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className={`h-14 w-14 rounded-full flex items-center justify-center ${
              isDangerous ? "bg-red-500/10 text-red-500" : "bg-indigo-500/10 text-indigo-500"
            }`}
          >
            <AlertCircle className="h-7 w-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[var(--color-on-surface)]">{title}</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              isDangerous
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-indigo-500 to-teal-400 hover:opacity-90"
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
