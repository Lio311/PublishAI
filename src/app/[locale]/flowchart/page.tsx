import FlowchartClient from './FlowchartClient';
import { checkIsAdmin } from "@/services/auth-utils";

export default async function FlowchartPage() {
  const isAdmin = await checkIsAdmin();
  return <FlowchartClient isAdmin={isAdmin} />;
}
