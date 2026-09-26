"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import NetworkGraph, { NetworkGraphSkeleton, TYPE_COLORS } from '@/components/analytics/NetworkGraph';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import {
  Brain,
  Share2,
  Layers,
  ArrowLeftRight,
  AlertCircle,
  RefreshCw
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

export function AnalyticsDashboardSkeleton() {
  return (
    <div 
      className="space-y-8 pb-12 animate-pulse"
      role="status"
      aria-busy="true"
      aria-label="Loading analytics dashboard"
    >
      {/* Header Skeleton */}
      <div className="rounded-2xl p-8 bg-slate-200 h-32" />

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="w-16 h-8 rounded bg-slate-200" />
            <div className="w-24 h-3 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="w-36 h-5 rounded bg-slate-200" />
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-slate-200 border-t-slate-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="w-40 h-5 rounded bg-slate-200" />
          <div className="h-[300px] flex flex-col justify-around py-4">
            {[1, 2, 3, 4, 5].map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-16 h-3 rounded bg-slate-200" />
                <div className="h-6 rounded bg-slate-200" style={{ width: `${b * 18}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 space-y-4">
        <div className="w-48 h-5 rounded bg-slate-200" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((r) => (
            <div key={r} className="h-10 rounded bg-slate-100 flex items-center px-4 justify-between">
              <div className="w-32 h-4 rounded bg-slate-200" />
              <div className="w-16 h-4 rounded bg-slate-200" />
              <div className="w-12 h-4 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Network Graph Skeleton */}
      <NetworkGraphSkeleton />
      <span className="sr-only">Loading analytics dashboard metrics and charts...</span>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const locale = useLocale();
  const t = useTranslations("Analytics");
  const isHe = locale === 'he';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/graph/analytics', { signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch analytics data (${res.status})`);
      }
      const json = await res.json();
      if (!isMountedRef.current) return;
      setData(json);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (!isMountedRef.current) return;
      setError(err?.message || 'Error loading analytics');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();
    fetchData(controller.signal);

    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, [fetchData]);

  if (loading) {
    return <AnalyticsDashboardSkeleton />;
  }

  if (error) {
    return (
      <div 
        role="alert"
        className="flex flex-col h-[50vh] items-center justify-center space-y-4 bg-red-50/50 rounded-2xl border border-red-200 p-8 text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-red-900">{t("errorLoading")}</h3>
          <p className="text-xs text-red-600 mt-1 max-w-md">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchData()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isHe ? 'נסה שוב' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  if (!data || data.summary.totalEntities === 0) {
    return (
      <div 
        role="region"
        aria-label="Empty Analytics Dashboard"
        className="flex flex-col h-[50vh] items-center justify-center space-y-4"
      >
        <Brain className="h-16 w-16 text-gray-300" />
        <p className="text-gray-500 text-lg text-center max-w-md">
          {t("empty")}
        </p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isHe ? 'רענן' : 'Refresh'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          {t("title")}
        </h1>
        <p className="mt-2 text-blue-100">
          {t("subtitle")}
        </p>
      </div>

      {/* Section A: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center">
          <Brain className="h-8 w-8 text-blue-500 mb-3" />
          <div className="text-4xl font-bold text-gray-800">{data.summary.totalEntities}</div>
          <div className="text-sm text-gray-500 mt-1">{t("totalEntities")}</div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center">
          <Share2 className="h-8 w-8 text-emerald-500 mb-3" />
          <div className="text-4xl font-bold text-gray-800">{data.summary.totalRelationships}</div>
          <div className="text-sm text-gray-500 mt-1">{t("totalRelationships")}</div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center">
          <Layers className="h-8 w-8 text-amber-500 mb-3" />
          <div className="text-2xl font-bold text-gray-800 capitalize truncate w-full">{data.summary.mostCommonEntityType || '-'}</div>
          <div className="text-sm text-gray-500 mt-1">{t("mostCommonEntity")}</div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center">
          <ArrowLeftRight className="h-8 w-8 text-red-500 mb-3" />
          <div className="text-2xl font-bold text-gray-800 capitalize truncate w-full">{data.summary.mostCommonRelationship || '-'}</div>
          <div className="text-sm text-gray-500 mt-1">{t("mostCommonRelationship")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section B: Entity Distribution */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {t("entityDistribution")}
          </h2>
          <div 
            className="h-[300px]"
            role="region"
            aria-label="Entity Distribution Pie Chart"
          >
            {/* Screen reader text alternative */}
            <div className="sr-only">
              <table>
                <caption>Entity type distribution</caption>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entityDistribution.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{entry.name}</td>
                      <td>{entry.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ErrorBoundary name="EntityDistributionChart">
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
                        fill={TYPE_COLORS[entry.name.toLowerCase()] || '#94a3b8'} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
        </div>

        {/* Section C: Relationship Distribution */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {t("relationshipDistribution")}
          </h2>
          <div 
            className="h-[300px]"
            role="region"
            aria-label="Relationship Distribution Bar Chart"
          >
            {/* Screen reader text alternative */}
            <div className="sr-only">
              <table>
                <caption>Relationship type distribution</caption>
                <thead>
                  <tr>
                    <th>Relationship</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.relationshipDistribution.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.name}</td>
                      <td>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ErrorBoundary name="RelationshipDistributionChart">
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
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Section D: Top Connected Entities */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {t("topEntities")}
        </h2>
        <div className="overflow-x-auto">
          <table 
            className="w-full text-left border-collapse min-w-[600px]"
            aria-label={t("topEntities")}
          >
            <thead>
              <tr className="border-b border-gray-200">
                <th scope="col" className={`pb-3 font-semibold text-gray-600 ${isHe ? 'text-right pr-4' : 'text-left pl-4'}`}>{t("headers.number")}</th>
                <th scope="col" className={`pb-3 font-semibold text-gray-600 ${isHe ? 'text-right' : 'text-left'}`}>{t("headers.name")}</th>
                <th scope="col" className={`pb-3 font-semibold text-gray-600 ${isHe ? 'text-right' : 'text-left'}`}>{t("headers.type")}</th>
                <th scope="col" className={`pb-3 font-semibold text-gray-600 ${isHe ? 'text-right' : 'text-left'}`}>{t("headers.connections")}</th>
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
                      style={{ backgroundColor: TYPE_COLORS[entity.type.toLowerCase()] || '#94a3b8' }}
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

      {/* Section E: Network Graph */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {t("networkGraph")}
        </h2>
        <ErrorBoundary name="NetworkGraphSection" fallback={<NetworkGraphSkeleton />}>
          <NetworkGraph />
        </ErrorBoundary>
      </div>
    </div>
  );
}
