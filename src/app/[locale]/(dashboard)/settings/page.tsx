import DashboardLayout from "@/components/layout/DashboardLayout";
import { setRequestLocale } from "next-intl/server";
import { checkIsAdmin } from "@/services/auth-utils";
import SettingsClient from "@/components/dashboard/SettingsClient";

export default async function SettingsPage({
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
      <SettingsClient locale={locale} />
    </DashboardLayout>
  );
}
