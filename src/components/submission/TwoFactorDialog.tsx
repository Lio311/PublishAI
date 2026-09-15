/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, X, Loader2 } from "lucide-react";

interface TwoFactorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
}

export function TwoFactorDialog({ isOpen, onClose, onSubmit }: TwoFactorDialogProps) {
  const t = useTranslations("submission.twoFactor");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      await onSubmit(code);
      setCode("");
    } catch (err: any) {
      setError(err.message || "Failed to verify 2FA code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-500" />
            <h2 className="text-lg font-semibold text-slate-800">{t("title")}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-slate-600 mb-6">
            {t("description")}
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                {t("codeLabel")}
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-center tracking-widest font-mono text-lg"
                autoComplete="one-time-code"
                autoFocus
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("verify")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
