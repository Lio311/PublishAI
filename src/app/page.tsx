import DashboardLayout from "@/components/layout/DashboardLayout";
import UploadZone from "@/components/dashboard/UploadZone";
import { FileText, Clock, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">ברוך הבא ל-PublishAI 👋</h1>
        <p className="text-slate-600">העלה מאמר כדי להתחיל בתהליך עריכה וריוויזיה אקדמית לקראת פרסום.</p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">מאמרים בתהליך</p>
            <p className="text-2xl font-bold text-slate-800">2</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">ממתינים לאישור</p>
            <p className="text-2xl font-bold text-slate-800">1</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">הושלמו</p>
            <p className="text-2xl font-bold text-slate-800">5</p>
          </div>
        </div>
      </div>

      {/* Main Upload Zone */}
      <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <UploadZone />
      </section>

      {/* Recent Papers */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">מאמרים אחרונים</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-0">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">שם המאמר</th>
                  <th className="px-6 py-4 font-medium">יעד (כתב עת)</th>
                  <th className="px-6 py-4 font-medium">סטטוס</th>
                  <th className="px-6 py-4 font-medium">תאריך עדכון</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-medium text-slate-800">The impact of LLMs on scientific writing</td>
                  <td className="px-6 py-4 text-slate-600">Nature Machine Intelligence</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      ממתין לאישור סקציה
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">לפני שעתיים</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-medium text-slate-800">A novel approach to dataset augmentation</td>
                  <td className="px-6 py-4 text-slate-600">IEEE Transactions</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      בעריכה (Opus)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">אתמול</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
