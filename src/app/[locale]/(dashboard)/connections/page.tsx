import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";
import { ConnectionsManager } from "@/components/submission/ConnectionsManager";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ConnectionsPage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  setRequestLocale(locale);
  const isAdmin = await checkIsAdmin();
  const t = await getTranslations("Connections");

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t("title")}
          </h1>
          <p className="text-slate-500 mt-1">
            {t("subtitle")}
          </p>
        </div>
        
        <ConnectionsManager />
      </div>
    </DashboardLayout>
  );
}
