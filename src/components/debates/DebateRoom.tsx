"use client";

import { useEffect, useState } from "react";
import DebateTranscript from "./DebateTranscript";
import ConsensusSummary from "./ConsensusSummary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Users, Radio, MessageSquare, Sparkles, RefreshCw } from "lucide-react";

export default function DebateRoom({ paperId }: { paperId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [consensus, setConsensus] = useState<string | null>(null);
  const [realDebateId, setRealDebateId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [streaming, setStreaming] = useState<boolean>(false);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/debates/${paperId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.debate?.id) {
          setRealDebateId(data.debate.id);
        }
        if (data.debate?.status === "consensus_reached") {
          setConsensus(data.debate.consensusSummary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch debate data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, [paperId]);

  useEffect(() => {
    if (!realDebateId) return;

    setStreaming(true);
    const evtSource = new EventSource(`/api/debates/${realDebateId}/stream`);
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
          label="Connecting to AI Review Chamber..."
          sublabel="Loading multi-agent transcripts, reviewer personas, and debate consensus"
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
            <h2 className="text-base font-bold text-slate-900">Scientific Review Debate Room</h2>
            <p className="text-xs text-slate-500">Autonomous peer reviewer agents debating methodology, novelty, and rigor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {streaming ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Debate Stream</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span>{messages.length} exchanges</span>
            </span>
          )}

          <button
            onClick={fetchInitial}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Refresh debate transcript"
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
            <h3 className="text-base font-semibold text-slate-800">No Review Debate Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              When the autonomous pipeline reaches the Review &amp; QA stage, specialized reviewer personas (e.g. Statistical Critic, Domain Specialist) will conduct a multi-turn adversarial debate here.
            </p>
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
