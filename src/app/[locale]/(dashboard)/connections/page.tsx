import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/lib/auth-utils";
import { ConnectionsManager } from "@/components/submission/ConnectionsManager";

export default async function ConnectionsPage() {
  const isAdmin = await checkIsAdmin();

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Journal Connections</h1>
          <p className="text-slate-500 mt-1">Manage your active connections to external journals and publishing platforms.</p>
        </div>
        
        <ConnectionsManager />
      </div>
    </DashboardLayout>
  );
}
