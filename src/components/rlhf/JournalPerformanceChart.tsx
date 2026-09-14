"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function JournalPerformanceChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, this would fetch an aggregated API of all journals, or loop them
  // Here we'll simulate fetching for some known journals or a dedicated endpoint.
  useEffect(() => {
    // Mocking an aggregated fetch for the chart
    setData([
      { name: 'Nature', accepted: 40, rejected: 24, revision: 20 },
      { name: 'Science', accepted: 30, rejected: 13, revision: 22 },
      { name: 'Cell', accepted: 20, rejected: 50, revision: 10 }
    ]);
    setLoading(false);
  }, []);

  if (loading) return <p>Loading chart...</p>;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="accepted" stackId="a" fill="#10b981" />
          <Bar dataKey="revision" stackId="a" fill="#f59e0b" />
          <Bar dataKey="rejected" stackId="a" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
