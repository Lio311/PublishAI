"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function AddJournalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("Journals");
  const tCommon = useTranslations("common");

  // Form state
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (res.ok) {
        toast.success(t("createSuccess"));
        setIsOpen(false);
        // Reset form
        setName("");
        
        // Refresh the page data
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.error || t("createFailed"));
      }
    } catch (error) {
      console.error("Failed to add journal:", error);
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        {t("addButton")}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-start"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-journal-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 id="add-journal-title" className="text-lg font-semibold text-slate-800">
                {t("modalTitle")}
              </h2>
              <button 
                type="button"
                onClick={() => !isLoading && setIsOpen(false)} 
                disabled={isLoading}
                aria-label={tCommon("cancel")}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label htmlFor="journal-name-input" className="block text-sm font-medium text-slate-700 mb-1">
                    {t("nameLabel")}
                  </label>
                  <input 
                    id="journal-name-input"
                    type="text" 
                    required
                    disabled={isLoading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    placeholder={t("namePlaceholder")}
                  />
                  {isLoading && (
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-2" role="status">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                      {t("fetchingDetails")}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  disabled={isLoading}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tCommon("cancel")}
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || !name.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? t("saving") : t("saveButton")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
