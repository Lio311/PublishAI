"use client";

import { useCallback, useEffect, useState } from "react";
import DebateTranscript from "./DebateTranscript";
import ConsensusSummary from "./ConsensusSummary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Users, Radio, MessageSquare, Sparkles, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DebateMessageDto } from "@/types/api";
import { errorName } from "@/services/utils/errors";

interface DebateResponse {
  debate?: { id: string; status?: string | null; consensusSummary?: string | null } | null;
  messages?: DebateMessageDto[];
}

export default function DebateRoom({ paperId }: { paperId: number }) {
  const t = useTranslations("PaperTools.debate");
  const [messages, setMessages] = useState<DebateMessageDto[]>([]);
  const [consensus, setConsensus] = useState<string | null>(null);
  const [realDebateId, setRealDebateId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

  const startDebate = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/debate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId }),
      });
      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || t("startFailed"));
      }
      // The debate record is created by the background job; poll until it appears.
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const poll = await fetch(`/api/debates/${paperId}`);
        if (poll.ok) {
          await fetchInitial();
          return;
        }
      }
    } catch (err) {
      setStartError(err instanceof Error ? err.message : t("startFailed"));
    } finally {
      setStarting(false);
    }
  };

  const loadDebate = useCallback(async (signal?: AbortSignal): Promise<DebateResponse | null> => {
    const res = await fetch(`/api/debates/${paperId}`, { signal });
    return res.ok ? res.json() : null;
  }, [paperId]);

  const applyDebate = useCallback((data: DebateResponse | null) => {
    if (data) {
      setMessages(data.messages || []);
      if (data.debate?.id) {
        setRealDebateId(data.debate.id);
      }
      if (data.debate?.status === "consensus_reached") {
        setConsensus(data.debate.consensusSummary ?? null);
      }
    }
    setLoading(false);
  }, []);

  const failDebate = useCallback((err: unknown) => {
    if (errorName(err) === "AbortError") return;
    console.error("Failed to fetch debate data:", err);
    setLoading(false);
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    await loadDebate().then(applyDebate, failDebate);
  };

  useEffect(() => {
    const controller = new AbortController();
    loadDebate(controller.signal).then(applyDebate, failDebate);
    return () => controller.abort();
  }, [loadDebate, applyDebate, failDebate]);

  useEffect(() => {
    if (!realDebateId) return;

    const evtSource = new EventSource(`/api/debates/${realDebateId}/stream`);
    evtSource.onopen = () => setStreaming(true);
    evtSource.onmessage = (event) => {
      try {
        const newMsg = JSON.parse(event.data);
        setMessages((prev) => {
          if (!prev.find((m) => m.id === newMsg.id)) {
            return [...prev, newMsg];
          }
          return prev;
        });
      } catch (e) {
        console.error("Error parsing debate stream message", e);
      }
    };

    evtSource.onerror = () => {
      setStreaming(false);
      evtSource.close();
    };

    return () => {
      evtSource.close();
      setStreaming(false);
    };
  }, [realDebateId]);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center p-8">
        <LoadingSpinner
          size="lg"
          label={t("loading")}
          sublabel={t("loadingDetail")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-100 text-sky-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("title")}</h2>
            <p className="text-xs text-slate-500">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {streaming ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t("live")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("exchanges", { count: messages.length })}</span>
            </span>
          )}

          <button
            onClick={fetchInitial}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            title={t("refresh")}
            aria-label={t("refresh")}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Debate Area */}
      <div className="p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">{t("emptyTitle")}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {t("emptyDescription")}
            </p>
            {!realDebateId && (
              <button
                type="button"
                onClick={startDebate}
                disabled={starting}
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
              >
                {starting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {starting ? t("starting") : t("start")}
              </button>
            )}
            {startError && <p className="text-xs text-rose-600">{startError}</p>}
          </div>
        ) : (
          <div className="max-h-[550px] overflow-y-auto pr-1">
            <DebateTranscript messages={messages} />
          </div>
        )}

        {consensus && <ConsensusSummary summary={consensus} />}
      </div>
    </div>
  );
}
