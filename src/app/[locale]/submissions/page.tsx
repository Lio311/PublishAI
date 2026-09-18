import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/lib/auth-utils";
import SubmissionsClient from "./SubmissionsClient";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "en";
  const isAdmin = false;

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <SubmissionsClient locale={locale} />
    </DashboardLayout>
  );
}
