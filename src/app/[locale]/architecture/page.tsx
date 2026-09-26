import ArchitectureClient from "./ArchitectureClient";
import { checkIsAdmin } from "@/services/auth-utils";
import { setRequestLocale } from "next-intl/server";

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  setRequestLocale(locale);
  const isAdmin = await checkIsAdmin();
  return <ArchitectureClient isAdmin={isAdmin} />;
}
