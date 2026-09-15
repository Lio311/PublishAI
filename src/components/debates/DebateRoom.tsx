"use client";

import { useEffect, useState } from "react";
import DebateTranscript from "./DebateTranscript";
import ConsensusSummary from "./ConsensusSummary";

export default function DebateRoom({ paperId }: { paperId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [consensus, setConsensus] = useState<string | null>(null);
  const [realDebateId, setRealDebateId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitial = async () => {
      const res = await fetch(`/api/debates/${paperId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setRealDebateId(data.debate.id);
        if (data.debate.status === "consensus_reached") {
          setConsensus(data.debate.consensusSummary);
        }
      }
    };
    fetchInitial();
  }, [paperId]);

  useEffect(() => {
    if (!realDebateId) return;

    const evtSource = new EventSource(`/api/debates/${realDebateId}/stream`);
    evtSource.onmessage = (event) => {
      const newMsg = JSON.parse(event.data);
      setMessages((prev) => {
        if (!prev.find(m => m.id === newMsg.id)) {
          return [...prev, newMsg];
        }
        return prev;
      });
    };

    return () => evtSource.close();
  }, [realDebateId]);

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Scientific Review Debate Room</h1>
      <DebateTranscript messages={messages} />
      {consensus && <ConsensusSummary summary={consensus} />}
    </div>
  );
}
