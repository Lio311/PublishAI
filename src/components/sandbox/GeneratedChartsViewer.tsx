"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function GeneratedChartsViewer({ paperId }: { paperId: number }) {
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await fetch(`/api/papers/${paperId}/sandbox`);
        const data = await res.json();
        
        if (data.charts) {
          setCharts(data.charts);
        }
      } catch (err) {
        console.error("Error fetching charts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, [paperId]);

  if (loading) return <div className="text-gray-500">Loading charts...</div>;
  if (charts.length === 0) return null;

  return (
    <div className="my-6">
      <h3 className="text-xl font-bold mb-4">Corrected Visualizations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charts.map((chart) => (
          <div key={chart.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm p-4 bg-white">
            <div className="relative w-full h-64 mb-4 bg-gray-50 flex items-center justify-center">
              {/* Note: In a real app with next/image, chartUrl domain needs to be configured in next.config.js. 
                  Using standard img tag here for flexibility with data URIs and arbitrary blob URLs. */}
              <img 
                src={chart.chartUrl} 
                alt={chart.description || "Generated Chart"}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <p className="text-sm text-gray-700 mb-4">{chart.description}</p>
            <div className="flex gap-2 mt-auto">
              <button className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 transition">
                Approve & Include
              </button>
              <button className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-red-100 transition">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
