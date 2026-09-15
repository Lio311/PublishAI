"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function AddJournalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const isHe = locale === 'he';

  // Form state
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setIsOpen(false);
        // Reset form
        setName("");
        
        // Refresh the page data
        router.refresh();
      } else {
        alert(isHe ? "נכשל להוסיף עיתון" : "Failed to add journal");
      }
    } catch (error) {
      console.error(error);
      alert(isHe ? "אירעה שגיאה" : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        {isHe ? 'הוספת עיתון' : 'Add Journal'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-start">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">{isHe ? 'הוסף עיתון חדש' : 'Add New Journal'}</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{isHe ? 'שם העיתון *' : 'Journal Name *'}</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder={isHe ? "לדוגמה: Science" : "e.g. Science"}
                  />
                  {isLoading && (
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isHe ? 'מושך נתונים אוטומטית...' : 'Fetching journal details automatically...'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900 transition-colors"
                >
                  {isHe ? 'ביטול' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || !name}
                  className="px-6 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin hidden" />}
                  {isLoading ? (isHe ? 'שומר...' : 'Saving...') : (isHe ? 'שמור עיתון' : 'Save Journal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
