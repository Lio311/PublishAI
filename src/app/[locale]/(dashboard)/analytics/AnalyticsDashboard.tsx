"use client";

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import NetworkGraph from '@/components/analytics/NetworkGraph';
import {
  Brain,
  Share2,
  Layers,
  ArrowLeftRight,
  Loader2
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from 'recharts';

const TYPE_COLORS: Record<string, string> = {
  drug: '#3b82f6',
  protein: '#10b981',
  gene: '#f59e0b',
  disease: '#ef4444',
  concept: '#8b5cf6',
  study: '#ec4899',
  method: '#06b6d4',
  default: '#94a3b8'
};

interface AnalyticsData {
  summary: {
    totalEntities: number;
    totalRelationships: number;
    mostCommonEntityType: string;
    mostCommonRelationship: string;
  };
  entityDistribution: { name: string; value: number }[];
  relationshipDistribution: { name: string; value: number }[];
  topEntities: { id: string; name: string; type: string; connections: number }[];
}

export default function AnalyticsDashboard() {
  const locale = useLocale();
  const isHe = locale === 'he';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/graph/analytics');
        if (!res.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-red-500">{isHe ? 'שגיאה בטעינת נתונים' : 'Error loading data'}: {error}</p>
      </div>
    );
  }

  if (!data || data.summary.totalEntities === 0) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
        <Brain className="h-16 w-16 text-gray-300" />
        <p className="text-gray-500 text-lg text-center max-w-md">
          {isHe 
            ? 'אין נתונים עדיין. עבד מאמר כדי לאכלס את גרף הידע.' 
            : 'No data yet. Process a paper to populate the knowledge graph.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 pb-12 ${isHe ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          {isHe ? 'לוח ניתוח GraphRAG' : 'GraphRAG Analytics Dashboard'}
        </h1>
        <p className="mt-2 text-blue-100">
          {isHe ? 'תובנות מגרף הידע שלך' : 'Insights from your knowledge graph'}
        </p>
      </div>

      {/* Section A: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center">
          <Brain className="h-8 w-8 text-blue-500 mb-3" />
          <div className="text-4xl font-bold text-gray-800">{data.summary.totalEntities}</div>
          <div className="text-sm text-gray-500 mt-1">{isHe ? 'סך הכל ישויות' : 'Total Entities'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center">
          <Share2 className="h-8 w-8 text-emerald-500 mb-3" />
          <div className="text-4xl font-bold text-gray-800">{data.summary.totalRelationships}</div>
          <div className="text-sm text-gray-500 mt-1">{isHe ? 'סך הכל קשרים' : 'Total Relationships'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center">
          <Layers className="h-8 w-8 text-amber-500 mb-3" />
          <div className="text-2xl font-bold text-gray-800 capitalize truncate w-full">{data.summary.mostCommonEntityType || '-'}</div>
          <div className="text-sm text-gray-500 mt-1">{isHe ? 'סוג ישות נפוץ ביותר' : 'Most Common Entity Type'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center">
          <ArrowLeftRight className="h-8 w-8 text-red-500 mb-3" />
          <div className="text-2xl font-bold text-gray-800 capitalize truncate w-full">{data.summary.mostCommonRelationship || '-'}</div>
          <div className="text-sm text-gray-500 mt-1">{isHe ? 'קשר נפוץ ביותר' : 'Most Common Relationship'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section B: Entity Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {isHe ? 'התפלגות ישויות' : 'Entity Distribution'}
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.entityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.entityDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={TYPE_COLORS[entry.name.toLowerCase()] || TYPE_COLORS.default} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section C: Relationship Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {isHe ? 'התפלגות קשרים' : 'Relationship Distribution'}
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.relationshipDistribution}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="url(#colorBar)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="value" position="right" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section D: Top Connected Entities */}
      <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
      {/* Section E: Network Graph */}
      <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {isHe ? 'גרף קשרים' : 'Network Graph'}
        </h2>
        <NetworkGraph />
      </div>


          {isHe ? 'הישויות המקושרות ביותר' : 'Top Connected Entities'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className={`pb-3 font-semibold text-gray-600 ${isHe ? 'text-right pr-4' : 'text-left pl-4'}`}>#</th>
                <th className={`pb-3 font-semibold text-gray-600 ${isHe ? 'text-right' : 'text-left'}`}>{isHe ? 'שם' : 'Name'}</th>
                <th className={`pb-3 font-semibold text-gray-600 ${isHe ? 'text-right' : 'text-left'}`}>{isHe ? 'סוג' : 'Type'}</th>
                <th className={`pb-3 font-semibold text-gray-600 ${isHe ? 'text-right' : 'text-left'}`}>{isHe ? 'קשרים' : 'Connections'}</th>
              </tr>
            </thead>
            <tbody>
              {data.topEntities.slice(0, 10).map((entity, index) => (
                <tr key={entity.id || index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className={`py-4 text-gray-500 ${isHe ? 'pr-4' : 'pl-4'}`}>{index + 1}</td>
                  <td className="py-4 font-medium text-gray-800">{entity.name}</td>
                  <td className="py-4">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: TYPE_COLORS[entity.type.toLowerCase()] || TYPE_COLORS.default }}
                    >
                      {entity.type}
                    </span>
                  </td>
                  <td className="py-4 font-semibold text-gray-700">{entity.connections}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
