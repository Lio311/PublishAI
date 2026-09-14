"use client";

import { useState } from "react";
import { User, Bell, Shield, Key } from "lucide-react";

type Tab = "profile" | "notifications" | "privacy" | "api_keys";

export default function SettingsClient({ locale }: { locale: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setIsSaved(false);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 800);
  };

  const renderSaveButton = () => (
    <div className="mt-8 flex items-center gap-4 border-t border-slate-200 pt-6">
      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
      >
        {isSaving && (
          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}
        {locale === "he" ? "שמור שינויים" : "Save Changes"}
      </button>
      {isSaved && (
        <span className="text-sm text-emerald-600 font-medium">
          {locale === "he" ? "השינויים נשמרו בהצלחה!" : "Changes saved successfully!"}
        </span>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {locale === "he" ? "הגדרות חשבון" : "Account Settings"}
        </h1>
        <p className="text-slate-500 mt-1">
          {locale === "he"
            ? "נהל את ההעדפות, ההתראות והמידע האישי שלך."
            : "Manage your preferences, notifications, and personal information."}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
          {/* Settings Sidebar */}
          <div
            className={`border-${
              locale === "he" ? "l" : "r"
            } border-slate-200 bg-slate-50 p-4 space-y-1`}
          >
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 font-medium rounded-lg transition-colors ${
                activeTab === "profile"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <User className="w-5 h-5" />
              {locale === "he" ? "פרופיל" : "Profile"}
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 font-medium rounded-lg transition-colors ${
                activeTab === "notifications"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Bell className="w-5 h-5" />
              {locale === "he" ? "התראות" : "Notifications"}
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 font-medium rounded-lg transition-colors ${
                activeTab === "privacy"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Shield className="w-5 h-5" />
              {locale === "he" ? "פרטיות" : "Privacy"}
            </button>
            <button
              onClick={() => setActiveTab("api_keys")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 font-medium rounded-lg transition-colors ${
                activeTab === "api_keys"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Key className="w-5 h-5" />
              {locale === "he" ? "חיבורי API" : "API Keys"}
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 p-8">
            {activeTab === "profile" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {locale === "he" ? "פרטים אישיים" : "Personal Information"}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-1">
                      <label className="text-sm font-medium text-slate-700">
                        {locale === "he" ? "שם מלא" : "Full Name"}
                      </label>
                      <input
                        type="text"
                        defaultValue="Dr. Researcher"
                        className="max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      <label className="text-sm font-medium text-slate-700">
                        {locale === "he" ? "כתובת אימייל" : "Email Address"}
                      </label>
                      <input
                        type="email"
                        defaultValue="researcher@university.edu"
                        className="max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      <label className="text-sm font-medium text-slate-700">
                        {locale === "he" ? "תפקיד אקדמי" : "Academic Role"}
                      </label>
                      <select className="max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option>{locale === "he" ? "פרופסור" : "Professor"}</option>
                        <option>{locale === "he" ? "חוקר/ת" : "Researcher"}</option>
                        <option>{locale === "he" ? "סטודנט/ית לתואר שלישי" : "PhD Student"}</option>
                        <option>{locale === "he" ? "אחר" : "Other"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {locale === "he" ? "העדפות שפה" : "Language Preferences"}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {locale === "he"
                      ? "ניתן לשנות את שפת הממשק דרך כפתור השפה בסרגל הצד השמאלי למטה."
                      : "You can change the interface language using the language toggle button in the bottom left sidebar."}
                  </p>
                </div>
                {renderSaveButton()}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {locale === "he" ? "הגדרות התראות" : "Notification Settings"}
                  </h3>
                  <div className="space-y-6">
                    
                    <div className="flex items-center justify-between max-w-md">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">{locale === "he" ? "התראות דוא\"ל" : "Email Notifications"}</h4>
                        <p className="text-sm text-slate-500">{locale === "he" ? "קבל עדכונים על מאמרים וביקורות." : "Receive updates about papers and reviews."}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between max-w-md">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">{locale === "he" ? "התראות דפדפן" : "Browser Push Notifications"}</h4>
                        <p className="text-sm text-slate-500">{locale === "he" ? "התראות בזמן אמת במסך שלך." : "Real-time notifications on your screen."}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between max-w-md">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">{locale === "he" ? "סיכום שבועי" : "Weekly Digest"}</h4>
                        <p className="text-sm text-slate-500">{locale === "he" ? "אימייל שבועי עם סיכום הפעילות." : "Weekly email summarizing your activity."}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                  </div>
                </div>
                {renderSaveButton()}
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {locale === "he" ? "פרטיות ואבטחה" : "Privacy & Security"}
                  </h3>
                  <div className="space-y-6">
                    
                    <div className="flex items-center justify-between max-w-md">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">{locale === "he" ? "פרופיל ציבורי" : "Public Profile"}</h4>
                        <p className="text-sm text-slate-500">{locale === "he" ? "הפוך את הפרופיל שלך לגלוי לחוקרים אחרים." : "Make your profile visible to other researchers."}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between max-w-md">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">{locale === "he" ? "איסוף נתוני מחקר" : "Data Collection for AI"}</h4>
                        <p className="text-sm text-slate-500">{locale === "he" ? "אישור שימוש במאמרים שלך לשיפור המודל." : "Allow usage of your papers to improve AI models."}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="pt-4">
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        {locale === "he" ? "מחיקת חשבון וכל הנתונים" : "Delete account and all data"}
                      </button>
                    </div>

                  </div>
                </div>
                {renderSaveButton()}
              </div>
            )}

            {activeTab === "api_keys" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {locale === "he" ? "חיבורי API חיצוניים" : "External API Integrations"}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {locale === "he" 
                      ? "הזן את מפתחות ה-API שלך כדי להשתמש במודלים חיצוניים. המפתחות נשמרים בצורה מוצפנת." 
                      : "Enter your API keys to use external models. Keys are stored securely and encrypted."}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-1">
                      <label className="text-sm font-medium text-slate-700">OpenAI API Key</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        className="max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1 mt-4">
                      <label className="text-sm font-medium text-slate-700">Anthropic API Key</label>
                      <input
                        type="password"
                        placeholder="sk-ant-..."
                        className="max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                {renderSaveButton()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
