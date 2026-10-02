import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import RlhfClient from "./RlhfClient";

export default async function RlhfPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // RLHF evaluation data spans all users, so the page is admin-only (as are its APIs).
  if (!(await checkIsAdmin())) {
    redirect(`/${locale}`);
  }

  return (
    <DashboardLayout isAdmin>
      <RlhfClient />
    </DashboardLayout>
  );
}
