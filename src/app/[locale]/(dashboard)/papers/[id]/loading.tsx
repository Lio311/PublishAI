import React from "react";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function PaperDetailsLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2">
      {/* Back button skeleton */}
      <Skeleton className="h-5 w-32 rounded-lg" />

      {/* Paper Header Card Skeleton */}
      <div className="p-6 bg-white/80 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1 max-w-2xl">
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </div>

      {/* Tabs Bar Skeleton */}
      <div className="flex gap-3 border-b border-slate-200 pb-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Active Tab Content Skeleton */}
      <div className="p-8 bg-white/80 rounded-3xl border border-slate-200/80 min-h-[350px] flex items-center justify-center">
        <LoadingSpinner
          size="lg"
          label="Loading Paper Workspace..."
          sublabel="Fetching manuscript status, analysis charts, and debate stream"
        />
      </div>
    </div>
  );
}
