import React from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
      <LoadingSpinner size="xl" label="Loading PublishAI..." sublabel="Preparing workspace and syncing session" />
    </div>
  );
}
