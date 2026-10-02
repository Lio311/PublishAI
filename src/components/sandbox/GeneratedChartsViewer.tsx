"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Download, X, BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GeneratedChartDto } from "@/types/api";
import Image from "next/image";

export function GeneratedChartsViewer({ paperId }: { paperId: number }) {
  const t = useTranslations("PaperTools.sandbox");
  const [charts, setCharts] = useState<GeneratedChartDto[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
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

  if (loading) {
    return (
      <div className="my-6 p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center">
        <LoadingSpinner size="md" label={t("loadingCharts")} />
      </div>
    );
  }

  if (charts.length === 0) return null;

  return (
    <div className="my-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-teal-100 text-teal-600">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">{t("chartsTitle")}</h3>
          <p className="text-xs text-slate-500">{t("chartsSubtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charts.filter((c) => !dismissed.has(c.id)).map((chart) => (
          <div
            key={chart.id}
            className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white/90 backdrop-blur-md p-5 flex flex-col hover:shadow-sm transition-all"
          >
            <div className="relative w-full h-64 mb-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-3">
              {/* Sandbox charts are data/blob URLs, so Next image optimization does not apply. */}
              <Image
                src={chart.chartUrl}
                alt={chart.description || t("chartAlt")}
                fill
                unoptimized
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain rounded-lg p-3"
              />
            </div>
            <p className="text-xs text-slate-700 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-sans">
              {chart.description}
            </p>
            <div className="flex gap-2.5 mt-auto pt-3 border-t border-slate-100">
              <a
                href={chart.chartUrl}
                download
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("download")}</span>
              </a>
              <button
                type="button"
                onClick={() => setDismissed((prev) => new Set(prev).add(chart.id))}
                className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer">
                <X className="w-3.5 h-3.5" />
                <span>{t("dismiss")}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
