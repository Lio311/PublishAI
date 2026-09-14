import DashboardLayout from "@/components/layout/DashboardLayout";
import { getTranslations } from "next-intl/server";
import { checkIsAdmin } from "@/lib/auth-utils";
import SettingsClient from "@/components/dashboard/SettingsClient";

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
      <SettingsClient locale={locale} />
    </DashboardLayout>
  );
}
