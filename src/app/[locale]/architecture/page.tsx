import ArchitectureClient from "./ArchitectureClient";
import { checkIsAdmin } from "@/services/auth-utils";

export default async function ArchitecturePage() {
  const isAdmin = await checkIsAdmin();
  return <ArchitectureClient isAdmin={isAdmin} />;
}
