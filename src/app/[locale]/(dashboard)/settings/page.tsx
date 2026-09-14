import DashboardLayout from "@/components/layout/DashboardLayout";
import { User, Bell, Shield, Key } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { checkIsAdmin } from "@/lib/auth-utils";

export default async function SettingsPage({
  params
}: {
  params: { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const isAdmin = await checkIsAdmin();
  const t = await getTranslations("Dashboard");

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {locale === 'he' ? 'הגדרות חשבון' : 'Account Settings'}
          </h1>
          <p className="text-slate-500 mt-1">
            {locale === 'he' ? 'נהל את ההעדפות, ההתראות והמידע האישי שלך.' : 'Manage your preferences, notifications, and personal information.'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
            {/* Settings Sidebar */}
            <div className={`border-${locale === 'he' ? 'l' : 'r'} border-slate-200 bg-slate-50 p-4 space-y-1`}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 font-medium rounded-lg">
                <User className="w-5 h-5" />
                {locale === 'he' ? 'פרופיל' : 'Profile'}
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg">
                <Bell className="w-5 h-5" />
                {locale === 'he' ? 'התראות' : 'Notifications'}
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg">
                <Shield className="w-5 h-5" />
                {locale === 'he' ? 'פרטיות' : 'Privacy'}
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg">
                <Key className="w-5 h-5" />
                {locale === 'he' ? 'חיבורי API' : 'API Keys'}
              </button>
            </div>

            {/* Settings Content */}
            <div className="md:col-span-3 p-8 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {locale === 'he' ? 'פרטים אישיים' : 'Personal Information'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      {locale === 'he' ? 'שם מלא' : 'Full Name'}
                    </label>
                    <input 
                      type="text" 
                      defaultValue="Dr. Researcher"
                      className="max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      {locale === 'he' ? 'כתובת אימייל' : 'Email Address'}
                    </label>
                    <input 
                      type="email" 
                      defaultValue="researcher@university.edu"
                      className="max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  {locale === 'he' ? 'שמור שינויים' : 'Save Changes'}
                </button>
              </div>

              <div className="pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {locale === 'he' ? 'העדפות שפה' : 'Language Preferences'}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {locale === 'he' ? 'ניתן לשנות את שפת הממשק דרך כפתור השפה בסרגל הצד השמאלי למטה.' : 'You can change the interface language using the language toggle button in the bottom left sidebar.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
