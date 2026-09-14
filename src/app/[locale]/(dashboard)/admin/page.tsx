import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { DollarSign, Users, Activity, BarChart3, BrainCircuit } from "lucide-react";

export default async function AdminDashboardPage({
  params
}: {
  params: { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  
  // Protect route
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect(`/${locale}`);
  }

  // Mock data for Phase 4 billing/cost tracking visualization
  const stats = {
    totalCost: "$1,245.50",
    costPerPaper: "$24.90",
    activeUsers: 12,
    papersProcessed: 50
  };

  const agentBreakdown = [
    { name: "Scientific Review Agent (Opus)", cost: 450, percentage: 36 },
    { name: "Academic Writing Agent (Opus)", cost: 520, percentage: 42 },
    { name: "Planning Agent (Opus)", cost: 150, percentage: 12 },
    { name: "Knowledge Agent (Sonnet)", cost: 75.50, percentage: 6 },
    { name: "QA & Verification (Sonnet)", cost: 50, percentage: 4 },
  ];

  return (
    <DashboardLayout isAdmin={true}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {locale === 'he' ? 'ניהול מערכת ועלויות' : 'Admin & Cost Dashboard'}
            </h1>
            <p className="text-slate-500 mt-1">
              {locale === 'he' 
                ? 'מעקב אחר עלויות API של Claude, ניתוח שימוש בסוכנים ומשתמשים פעילים.' 
                : 'Track Claude API costs, analyze agent usage, and monitor active users.'}
            </p>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{locale === 'he' ? 'עלות כוללת (API)' : 'Total API Cost'}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCost}</p>
              </div>
              <div className="bg-indigo-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{locale === 'he' ? 'ממוצע עלות למאמר' : 'Avg Cost per Paper'}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.costPerPaper}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{locale === 'he' ? 'משתמשים פעילים' : 'Active Users'}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.activeUsers}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{locale === 'he' ? 'מאמרים עובדו' : 'Papers Processed'}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.papersProcessed}</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              {locale === 'he' ? 'התפלגות עלויות לפי סוכן AI' : 'Cost Breakdown by AI Agent'}
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {agentBreakdown.map((agent, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{agent.name}</span>
                    <span className="text-slate-500 font-medium">${agent.cost.toFixed(2)} ({agent.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${agent.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
