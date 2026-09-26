import AnalyticsDashboard from './AnalyticsDashboard';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";
import { setRequestLocale } from "next-intl/server";

export default async function AnalyticsPage({
  params
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  setRequestLocale(locale);
  const isAdmin = await checkIsAdmin();
  return (
    <DashboardLayout isAdmin={isAdmin}>
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}
