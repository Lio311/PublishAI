"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function JournalPerformanceChart({ journalId = 1 }: { journalId?: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rlhf/analytics/journal/${journalId}`)
      .then(res => res.json())
      .then(json => {
        setData(json.timeline || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch journal analytics timeline:", err);
        setLoading(false);
      });
  }, [journalId]);

  if (loading) return <p>Loading chart...</p>;

  if (data.length === 0) return <p>No data available for this journal.</p>;

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
          <XAxis dataKey="date" />
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
