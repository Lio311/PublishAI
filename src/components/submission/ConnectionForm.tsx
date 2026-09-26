"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, Link as LinkIcon, CheckCircle, XCircle } from "lucide-react";

interface ConnectionFormProps {
  onSuccess: (connectionId: string | number) => void;
  onCancel: () => void;
}

export function ConnectionForm({ onSuccess, onCancel }: ConnectionFormProps) {
  const t = useTranslations("submission.connection");
  const locale = useLocale();
  const isHe = locale === "he";
  const [platform, setPlatform] = useState<"wordpress" | "ojs" | "email">("wordpress");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [captchaStrategy, setCaptchaStrategy] = useState<"auto" | "manual">("auto");
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; userRole?: string } | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSaveError("");
    
    try {
      const res = await fetch("/api/journal-connection/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, siteUrl, username, password, captchaStrategy }),
      });
      
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Fallback for non-JSON
      }

      if (res.ok && data?.success) {
        setTestResult(data);
      } else {
        const errorMsg = data?.message || data?.error || (isHe ? "בדיקת החיבור נכשלה. אנא ודא את הפרטים." : "Connection test failed. Please verify credentials.");
        setTestResult({ success: false, message: errorMsg, userRole: data?.userRole });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: isHe ? "אירעה שגיאת רשת. בדוק את החיבור ונסה שוב." : "Network error occurred. Please check connectivity and try again." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-test if not tested yet
    if (!testResult?.success) {
      setSaveError(isHe ? "אנא הפעל בדיקת התחברות מוצלחת תחילה." : "Please run a successful connection test first.");
      return;
    }
    
    setIsSaving(true);
    setSaveError("");
    
    try {
      const res = await fetch("/api/journal-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          platform, 
          siteUrl, 
          username, 
          password, 
          displayName: displayName.trim() || undefined,
          captchaStrategy,
          testResult 
        }),
      });
      
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Non-JSON
      }

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || (isHe ? "נכשל בשמירת החיבור." : "Failed to save connection.");
        throw new Error(errorMsg);
      }
      
      onSuccess(data.id);
    } catch (err: any) {
      setSaveError(err.message || (isHe ? "נכשל בשמירת החיבור." : "Failed to save connection."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-2xl mx-auto" noValidate>
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-800">{t("title")}</h2>
        <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      <div className="p-6 space-y-5">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700 mb-2">
            {isHe ? "בחר פלטפורמה" : "Select Platform"}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="radiogroup" aria-label={isHe ? "פלטפורמת עיתון" : "Journal Platform"}>
            <label className={`border rounded-lg p-4 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1 ${platform === "wordpress" ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500" : "border-slate-200 hover:border-blue-300"}`}>
              <input 
                type="radio" 
                name="platform" 
                value="wordpress"
                className="sr-only"
                checked={platform === "wordpress"}
                onChange={() => setPlatform("wordpress")}
              />
              <div className="font-semibold text-slate-800">WordPress</div>
              <div className="text-xs text-slate-500 mt-1">REST API (Application Password)</div>
            </label>
            
            <label className={`border rounded-lg p-4 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1 ${platform === "ojs" ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500" : "border-slate-200 hover:border-blue-300"}`}>
              <input 
                type="radio" 
                name="platform" 
                value="ojs"
                className="sr-only"
                checked={platform === "ojs"}
                onChange={() => setPlatform("ojs")}
              />
              <div className="font-semibold text-slate-800">OJS (Open Journal Systems)</div>
              <div className="text-xs text-slate-500 mt-1">OJS 3.x REST API</div>
            </label>

            <label className={`border rounded-lg p-4 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1 ${platform === "email" ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500" : "border-slate-200 hover:border-blue-300"}`}>
              <input 
                type="radio" 
                name="platform" 
                value="email"
                className="sr-only"
                checked={platform === "email"}
                onChange={() => setPlatform("email")}
              />
              <div className="font-semibold text-slate-800">Gmail / Outlook</div>
              <div className="text-xs text-slate-500 mt-1">Email / OAuth Integration</div>
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="conn-site-url" className="block text-sm font-medium text-slate-700 mb-1">{t("siteUrl")}</label>
          <input 
            id="conn-site-url"
            type="url" 
            required 
            aria-required="true"
            placeholder="https://journal.example.com"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            value={siteUrl}
            onChange={(e) => { setSiteUrl(e.target.value); setTestResult(null); }}
          />
        </div>

        <div>
          <label htmlFor="conn-display-name" className="block text-sm font-medium text-slate-700 mb-1">{t("displayName")} {isHe ? "(אופציונלי)" : "(Optional)"}</label>
          <input 
            id="conn-display-name"
            type="text" 
            placeholder="My Medical Journal"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="conn-captcha-strategy" className="block text-sm font-medium text-slate-700 mb-1">{isHe ? "אסטרטגיית זיהוי רובוטים (Captcha)" : "Captcha Strategy"}</label>
          <select 
            id="conn-captcha-strategy"
            value={captchaStrategy}
            onChange={(e) => setCaptchaStrategy(e.target.value as "auto" | "manual")}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="auto">{isHe ? "אוטומטי (מומלץ)" : "Auto (Recommended)"}</option>
            <option value="manual">{isHe ? "ידני" : "Manual"}</option>
          </select>
        </div>

        <div>
          <label htmlFor="conn-username" className="block text-sm font-medium text-slate-700 mb-1">
            {platform === "wordpress" ? t("username") : t("apiToken")}
          </label>
          <input 
            id="conn-username"
            type="text" 
            required 
            aria-required="true"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setTestResult(null); }}
          />
        </div>

        {platform === "wordpress" && (
          <div>
            <label htmlFor="conn-password" className="block text-sm font-medium text-slate-700 mb-1">{t("password")}</label>
            <input 
              id="conn-password"
              type="password" 
              required 
              aria-required="true"
              placeholder="Application Password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setTestResult(null); }}
            />
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !siteUrl || !username || (platform === "wordpress" && !password)}
            aria-busy={isTesting}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
            {t("testConnection")}
          </button>
          
          {testResult && (
            <div 
              role="status" 
              aria-live="polite" 
              className={`flex items-center gap-2 text-sm font-medium ${testResult.success ? "text-emerald-600" : "text-rose-600"}`}
            >
              {testResult.success ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
              <span>{testResult.message} {testResult.userRole && `(Role: ${testResult.userRole})`}</span>
            </div>
          )}
        </div>

        {saveError && (
          <div role="alert" className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
            {saveError}
          </div>
        )}
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
        <button 
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900 transition-colors"
        >
          {t("cancel")}
        </button>
        <button 
          type="submit"
          disabled={isSaving || !testResult?.success}
          aria-busy={isSaving}
          className="px-6 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("saveConnection")}
        </button>
      </div>
    </form>
  );
}
