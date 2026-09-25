import AnalyticsDashboard from './AnalyticsDashboard';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";

export default async function AnalyticsPage() {
  const isAdmin = await checkIsAdmin();
  return (
    <DashboardLayout isAdmin={isAdmin}>
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}
