/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const CustomLegend = ({ payload }: { payload?: any[] }) => {
  if (!payload) return null;
  return (
    <div className="flex flex-col gap-2 mt-4 px-4" dir="rtl">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-3 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
          <span className="text-gray-600 font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-xl text-right z-50" dir="rtl">
        <p className="font-bold mb-2 text-gray-800 border-b pb-1 text-sm">{label}</p>
        <div className="flex flex-col gap-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-4 items-center">
              <span className="text-xs text-gray-400 font-bold">{entry.name}:</span>
              <span style={{ color: entry.color }} className="text-sm font-mono font-bold">
                {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ 
  papersData, 
  usersData 
}: { 
  papersData: { date: string; count: number }[]; 
  usersData: { date: string; count: number }[]; 
}) {
  const [chartMode, setChartMode] = React.useState<'papers' | 'users'>('papers');

  const currentData = chartMode === 'papers' ? papersData : usersData;

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
      <div className="flex justify-between items-center mb-6" dir="rtl">
        <h3 className="text-base md:text-lg font-bold text-slate-800">
          {chartMode === 'papers' ? 'צמיחת מאמרים' : 'רישום משתמשים'}
        </h3>
        <div className="flex bg-slate-100 p-1 rounded-lg scale-90 md:scale-100">
          <button
            onClick={() => setChartMode('papers')}
            className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-md transition ${chartMode === 'papers' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-black'}`}
          >
            מאמרים
          </button>
          <button
            onClick={() => setChartMode('users')}
            className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-md transition ${chartMode === 'users' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-black'}`}
          >
            משתמשים
          </button>
        </div>
      </div>
      <div className="h-[250px] md:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af' }}
              tickCount={(typeof window !== 'undefined' && window.innerWidth < 768) ? 6 : undefined}
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af' }}
              orientation="left"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
            <Legend content={<CustomLegend />} verticalAlign="bottom" align="center" />
            <Line
              name="כמות"
              type="monotone"
              dataKey="count"
              stroke="#6366f1" 
              strokeWidth={3}
              dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
