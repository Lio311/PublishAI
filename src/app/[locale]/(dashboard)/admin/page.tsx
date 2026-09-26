import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";
import { redirect } from "next/navigation";
import { Users, FileText, Activity, CheckCircle, List } from "lucide-react";
import { db } from "@/services/db";
import { users, papers } from "@/services/db/schema";
import { desc, eq, count, sql } from "drizzle-orm";
import DashboardCharts from "@/components/admin/DashboardCharts";
import UsersList from "@/components/admin/UsersList";
import RLHFAnalytics from "@/components/rlhf/AnalyticsDashboard";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AdminDashboardPage({
  params
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  setRequestLocale(locale);
  
  // Protect route
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("Admin");

  // Fetch real data from DB
  const [totalUsersResult] = await db.select({ value: count() }).from(users);
  const totalUsers = totalUsersResult?.value || 0;

  const [totalPapersResult] = await db.select({ value: count() }).from(papers);
  const totalPapers = totalPapersResult?.value || 0;

  const papersByStatus = await db
    .select({ status: papers.status, count: count() })
    .from(papers)
    .groupBy(papers.status);

  const completedPapers = papersByStatus.find(p => p.status === 'completed')?.count || 0;
  const inProgressPapers = papersByStatus.find(p => p.status === 'in_progress')?.count || 0;

  const recentPapers = await db
    .select({
      id: papers.id,
      title: papers.title,
      status: papers.status,
      createdAt: papers.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(papers)
    .leftJoin(users, eq(papers.userId, users.id))
    .orderBy(desc(papers.createdAt))
    .limit(10);
    
  // Fetch users for list
  const recentUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .limit(20);

  // Fetch data for charts (Papers created per day, last 30 days)
  const papersChartRaw = await db.execute(sql`
    SELECT 
      DATE(created_at) as date, 
      COUNT(*) as count
    FROM papers
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  
  // Format for Recharts
  const papersData = papersChartRaw.rows.map((row: any) => {
    const d = new Date(row.date);
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      count: Number(row.count)
    };
  });
  
  // If no emailVerified, we can't reliably get users over time, so we will just pass a dummy or use emailVerified as proxy
  const usersChartRaw = await db.execute(sql`
    SELECT 
      DATE(COALESCE("emailVerified", NOW())) as date, 
      COUNT(*) as count
    FROM users
    GROUP BY DATE(COALESCE("emailVerified", NOW()))
    ORDER BY date ASC
    LIMIT 30
  `);
  
  const usersData = usersChartRaw.rows.map((row: any) => {
    const d = new Date(row.date);
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      count: Number(row.count)
    };
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{t("status.completed")}</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-sky-100 text-sky-600 rounded-full text-xs">{t("status.in_progress")}</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">{t("status.pending")}</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">{t("status.failed")}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
    }
  };

  const isHe = locale === "he";

  return (
    <DashboardLayout isAdmin={true}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{t("stats.totalUsers")}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</p>
              </div>
              <div className="bg-sky-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-sky-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{t("stats.totalPapers")}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalPapers}</p>
              </div>
              <div className="bg-sky-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-sky-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{t("stats.inProgress")}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{inProgressPapers}</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{t("stats.completed")}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{completedPapers}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <DashboardCharts papersData={papersData} usersData={usersData} />
        
        {/* Users List */}
        <UsersList users={recentUsers} locale={locale} />

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <List className="w-5 h-5 text-sky-500" />
              {t("recentActivity.title")}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center table-fixed" dir={isHe ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 w-[8%]">{t("recentActivity.headers.id")}</th>
                  <th className="px-6 py-3 w-[35%]">{t("recentActivity.headers.title")}</th>
                  <th className="px-6 py-3 w-[22%]">{t("recentActivity.headers.user")}</th>
                  <th className="px-6 py-3 w-[20%]">{t("recentActivity.headers.date")}</th>
                  <th className="px-6 py-3 w-[15%]">{t("recentActivity.headers.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">#{paper.id}</td>
                    <td className="px-6 py-4 text-slate-700">{paper.title}</td>
                    <td className="px-6 py-4 text-slate-600">{paper.userName || paper.userEmail || (isHe ? 'לא ידוע' : 'Unknown')}</td>
                    <td className="px-6 py-4 text-slate-500" dir="ltr">
                      {paper.createdAt ? new Date(paper.createdAt).toLocaleDateString(isHe ? 'he-IL' : 'en-US') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(paper.status)}
                    </td>
                  </tr>
                ))}
                {recentPapers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      {t("recentActivity.noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* RLHF Analytics */}
        <div className="mb-8">
          <RLHFAnalytics />
        </div>
      </div>
    </DashboardLayout>
  );
}
