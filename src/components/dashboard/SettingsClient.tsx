"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Bell, Shield, Key, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Tab = "profile" | "notifications" | "privacy" | "api_keys";

export interface SettingsClientProps {
  locale: string;
}

export default function SettingsClient({ locale }: SettingsClientProps) {
  const isHe = locale === "he";

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [apiKeyStatus, setApiKeyStatus] = useState({
    openai: false,
    anthropic: false,
    google: false,
  });

  const [settings, setSettings] = useState({
    name: "",
    email: "",
    academicRole: "Researcher",
    emailNotifications: true,
    browserNotifications: false,
    weeklyDigest: true,
    publicProfile: true,
    dataCollectionForAi: false,
  });

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        throw new Error(`Failed to fetch settings: status ${res.status}`);
      }
      const data = await res.json();
      setSettings({
        name: data.name || "",
        email: data.email || "",
        academicRole: data.academicRole || "Researcher",
        emailNotifications: data.emailNotifications ?? true,
        browserNotifications: data.browserNotifications ?? false,
        weeklyDigest: data.weeklyDigest ?? true,
        publicProfile: data.publicProfile ?? true,
        dataCollectionForAi: data.dataCollectionForAi ?? false,
      });
      setApiKeyStatus({
        openai: data.openaiConfigured ?? false,
        anthropic: data.anthropicConfigured ?? false,
        google: data.googleConfigured ?? false,
      });
    } catch (err: any) {
      console.error("Failed to load settings:", err);
      setLoadError(err?.message || (isHe ? "שגיאה בטעינת ההגדרות." : "Failed to load settings."));
    } finally {
      setIsLoading(false);
    }
  }, [isHe]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleBrowserNotificationsToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;

    if (isChecked) {
      if (typeof window === "undefined" || !("Notification" in window)) {
        toast.error(isHe ? "הדפדפן שלך אינו תומך בהתראות." : "Your browser does not support notifications.");
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          handleSettingChange("browserNotifications", true);
          new Notification("PublishAI", {
            body: isHe ? "התראות דפדפן הופעלו בהצלחה!" : "Browser notifications successfully enabled!",
          });
        } else {
          toast.error(isHe ? "עליך לאשר התראות בהגדרות הדפדפן." : "You must allow notifications in browser settings.");
          handleSettingChange("browserNotifications", false);
        }
      } catch (err) {
        console.error("Notification permission error:", err);
        handleSettingChange("browserNotifications", false);
      }
    } else {
      handleSettingChange("browserNotifications", false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to save settings");
      }

      toast.success(isHe ? "השינויים נשמרו בהצלחה!" : "Changes saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error?.message || (isHe ? "שגיאה בשמירת ההגדרות." : "Error saving settings."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      isHe
        ? "האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו היא בלתי הפיכה ותמחק את כל המאמרים וההגדרות שלך."
        : "Are you sure you want to delete your account? This action is permanent and will delete all your papers and settings."
    );
    if (confirmed) {
      toast.info(
        isHe
          ? "בקשת מחיקת החשבון נקלטה. צור קשר עם התמיכה לאישור סופי."
          : "Account deletion request initiated. Please contact support for final verification."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse" role="status" aria-live="polite">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
            <span className="text-sm font-medium">{isHe ? "טוען הגדרות..." : "Loading settings..."}</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl space-y-6" role="status" aria-live="assertive">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {isHe ? "הגדרות חשבון" : "Account Settings"}
          </h1>
        </div>
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {isHe ? "שגיאה בטעינת ההגדרות" : "Failed to load account settings"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isHe ? "נסה שוב" : "Retry"}</span>
          </button>
        </div>
      </div>
    );
  }

  const renderSaveButton = () => (
    <div className="mt-8 flex items-center gap-4 border-t border-slate-200 pt-6">
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="bg-gradient-to-r from-blue-500 via-sky-500 to-sky-400 hover:from-sky-600 hover:via-sky-600 hover:to-sky-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs disabled:opacity-70 flex items-center gap-2 cursor-pointer"
      >
        {isSaving && (
          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}
        <span>{isSaving ? (isHe ? "שומר..." : "Saving...") : (isHe ? "שמור שינויים" : "Save Changes")}</span>
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6" dir={isHe ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isHe ? "הגדרות חשבון" : "Account Settings"}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {isHe
            ? "נהל את ההעדפות, ההתראות והמידע האישי שלך."
            : "Manage your preferences, notifications, and personal information."}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
          {/* Settings Sidebar */}
          <div
            className={`${
              isHe ? "border-l border-slate-200" : "border-r border-slate-200"
            } bg-slate-50/70 p-4 space-y-1.5`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === "profile"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <User className="w-4 h-4" />
              <span>{isHe ? "פרופיל" : "Profile"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{isHe ? "התראות" : "Notifications"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === "privacy"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{isHe ? "פרטיות" : "Privacy"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("api_keys")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === "api_keys"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Key className="w-4 h-4" />
              <span>{isHe ? "חיבורי API" : "API Keys"}</span>
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 p-6 sm:p-8">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {isHe ? "פרטים אישיים" : "Personal Information"}
                  </h3>
                  <p className="text-xs text-slate-500 mb-5">
                    {isHe ? "עדכן את פרטי החוקר שלך עבור הצגת מסמכים ושיתוף פעולה." : "Update your academic profile and credentials."}
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-1.5">
                      <label htmlFor="settings-name" className="text-xs font-semibold text-slate-700">
                        {isHe ? "שם מלא" : "Full Name"}
                      </label>
                      <input
                        id="settings-name"
                        type="text"
                        value={settings.name}
                        onChange={(e) => handleSettingChange("name", e.target.value)}
                        className="max-w-md px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      <label htmlFor="settings-email" className="text-xs font-semibold text-slate-700">
                        {isHe ? "כתובת אימייל" : "Email Address"}
                      </label>
                      <input
                        id="settings-email"
                        type="email"
                        value={settings.email}
                        disabled
                        aria-disabled="true"
                        className="max-w-md px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      <label htmlFor="settings-role" className="text-xs font-semibold text-slate-700">
                        {isHe ? "תפקיד אקדמי" : "Academic Role"}
                      </label>
                      <select
                        id="settings-role"
                        value={settings.academicRole}
                        onChange={(e) => handleSettingChange("academicRole", e.target.value)}
                        className="max-w-md px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      >
                        <option value="Professor">{isHe ? "פרופסור" : "Professor"}</option>
                        <option value="Researcher">{isHe ? "חוקר/ת" : "Researcher"}</option>
                        <option value="PhD Student">{isHe ? "סטודנט/ית לתואר שלישי" : "PhD Student"}</option>
                        <option value="Postdoc">{isHe ? "פוסט-דוקטורנט/ית" : "Postdoctoral Fellow"}</option>
                        <option value="Other">{isHe ? "אחר" : "Other"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {isHe ? "העדפות שפה" : "Language Preferences"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isHe
                      ? "ניתן לשנות את שפת הממשק דרך כפתור השפה בסרגל הצד."
                      : "You can change the interface language using the language switcher in the navigation sidebar."}
                  </p>
                </div>
                {renderSaveButton()}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {isHe ? "הגדרות התראות" : "Notification Settings"}
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    {isHe ? "בחר באילו ערוצים תרצה לקבל עדכוני שיפוט והגשות." : "Configure communication channels for pipeline events."}
                  </p>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between max-w-md p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {isHe ? "התראות דוא\"ל" : "Email Notifications"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isHe ? "קבל עדכונים על מאמרים וביקורות." : "Receive updates about papers and reviews."}
                        </p>
                      </div>
                      <div dir="ltr">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            aria-label={isHe ? "התראות דוא\"ל" : "Email Notifications"}
                            checked={settings.emailNotifications}
                            onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between max-w-md p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {isHe ? "התראות דפדפן" : "Browser Push Notifications"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isHe ? "התראות בזמן אמת במסך שלך." : "Real-time notifications on your screen."}
                        </p>
                      </div>
                      <div dir="ltr">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            aria-label={isHe ? "התראות דפדפן" : "Browser Push Notifications"}
                            checked={settings.browserNotifications}
                            onChange={handleBrowserNotificationsToggle}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between max-w-md p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {isHe ? "סיכום שבועי" : "Weekly Digest"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isHe ? "אימייל שבועי עם סיכום הפעילות." : "Weekly email summarizing your activity."}
                        </p>
                      </div>
                      <div dir="ltr">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            aria-label={isHe ? "סיכום שבועי" : "Weekly Digest"}
                            checked={settings.weeklyDigest}
                            onChange={(e) => handleSettingChange("weeklyDigest", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                {renderSaveButton()}
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {isHe ? "פרטיות ואבטחה" : "Privacy & Security"}
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    {isHe ? "שלוט ברמת השיתוף של כתבי היד והנתונים שלך." : "Manage data retention and research visibility."}
                  </p>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between max-w-md p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {isHe ? "פרופיל ציבורי" : "Public Profile"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isHe ? "הפוך את הפרופיל שלך לגלוי לחוקרים אחרים." : "Make your profile visible to other researchers."}
                        </p>
                      </div>
                      <div dir="ltr">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            aria-label={isHe ? "פרופיל ציבורי" : "Public Profile"}
                            checked={settings.publicProfile}
                            onChange={(e) => handleSettingChange("publicProfile", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between max-w-md p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {isHe ? "איסוף נתוני מחקר" : "Data Collection for AI"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isHe ? "אישור שימוש במאמרים שלך לשיפור המודל." : "Allow usage of your papers to improve AI models."}
                        </p>
                      </div>
                      <div dir="ltr">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            aria-label={isHe ? "איסוף נתוני מחקר" : "Data Collection for AI"}
                            checked={settings.dataCollectionForAi}
                            onChange={(e) => handleSettingChange("dataCollectionForAi", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isHe ? "מחיקת חשבון וכל הנתונים" : "Delete account and all data"}</span>
                      </button>
                    </div>
                  </div>
                </div>
                {renderSaveButton()}
              </div>
            )}

            {activeTab === "api_keys" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {isHe ? "חיבורי API חיצוניים" : "External API Integrations"}
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    {isHe
                      ? "מפתחות ה-API מוגדרים על ידי מנהל המערכת כמשתני סביבה בשרת."
                      : "API keys are configured by the server administrator via environment variables."}
                  </p>

                  <div className="space-y-3">
                    {[
                      { label: "OpenAI", configured: apiKeyStatus.openai },
                      { label: "Anthropic", configured: apiKeyStatus.anthropic },
                      { label: "Google Gemini", configured: apiKeyStatus.google },
                    ].map(({ label, configured }) => (
                      <div key={label} className="flex items-center justify-between max-w-md px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        {configured ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {isHe ? "מוגדר" : "Configured"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {isHe ? "חסר" : "Not set"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

