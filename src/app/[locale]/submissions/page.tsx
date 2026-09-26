import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";
import SubmissionsClient from "./SubmissionsClient";
import { setRequestLocale } from "next-intl/server";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "en";
  setRequestLocale(locale);
  const isAdmin = await checkIsAdmin();

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <SubmissionsClient locale={locale} />
    </DashboardLayout>
  );
}
