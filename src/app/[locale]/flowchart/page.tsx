import FlowchartClient from './FlowchartClient';
import { checkIsAdmin } from "@/services/auth-utils";
import { setRequestLocale } from "next-intl/server";

export default async function FlowchartPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  setRequestLocale(locale);
  const isAdmin = await checkIsAdmin();
  return <FlowchartClient isAdmin={isAdmin} />;
}
