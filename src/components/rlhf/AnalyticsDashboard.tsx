"use client";

import React, { useEffect, useState } from "react";
import JournalPerformanceChart from "./JournalPerformanceChart";
import ExportDatasetModal from "./ExportDatasetModal";
import PromptStrategyManager from "./PromptStrategyManager";

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rlhf/analytics")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">RLHF Analytics Dashboard</h1>
      
      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 border rounded shadow-sm bg-blue-50 dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-2">Total Submissions</h2>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalSubmissions || 0}</p>
          </div>
          {stats?.outcomes?.map((outcome: any) => (
            <div key={outcome.status} className="p-4 border rounded shadow-sm bg-gray-50 dark:bg-gray-800">
              <h2 className="text-xl font-semibold mb-2 capitalize">{outcome.status.replace('_', ' ')}</h2>
              <p className="text-4xl font-bold">{outcome.count}</p>
              <p className="text-sm text-gray-500 mt-2">{outcome.percentage.toFixed(1)}% of total</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Performance by Journal</h2>
          <JournalPerformanceChart />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">A/B Testing Strategies</h2>
          <PromptStrategyManager />
        </div>
      </div>

      <div className="mt-8 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-4">Data Export</h2>
        <ExportDatasetModal />
      </div>
    </div>
  );
}
