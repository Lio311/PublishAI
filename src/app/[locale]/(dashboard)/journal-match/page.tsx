import DashboardLayout from "@/components/layout/DashboardLayout";
import JournalMatchClient from "@/components/journal-match/JournalMatchClient";
import { checkIsAdmin } from "@/services/auth-utils";
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function JournalMatchPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const isAdmin = await checkIsAdmin();
  return (
    <DashboardLayout isAdmin={isAdmin}>
      <JournalMatchClient />
    </DashboardLayout>
  );
}
