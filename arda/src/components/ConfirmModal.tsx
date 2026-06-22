import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: "error" | "warning" | "info" | "success";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Evet, Onayla",
  cancelText = "Vazgeç",
  onConfirm,
  onCancel,
  severity = "error"
}: ConfirmModalProps) {
  
  const iconColor = {
    error: "bg-rose-50 text-rose-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-indigo-50 text-indigo-600",
    success: "bg-emerald-50 text-emerald-600"
  }[severity];

  const confirmBtnColor = {
    error: "bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-200 text-white",
    info: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white"
  }[severity];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop screen overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          
          {/* Modal box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white border border-slate-150 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative z-10 flex flex-col items-center text-center space-y-4"
          >
            {/* Action Icon badge with variant severity */}
            <div className={`w-12 h-12 ${iconColor} rounded-full flex items-center justify-center`}>
              <ShieldAlert size={24} />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 w-full pt-1">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all active:scale-98 cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all active:scale-98 shadow-sm cursor-pointer ${confirmBtnColor}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
