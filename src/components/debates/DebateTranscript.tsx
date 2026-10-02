import React, { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import AgentAvatar from "./AgentAvatar";
import type { DebateAgentDto, DebateMessageDto } from "@/types/api";

const KNOWN_PERSONAS = ["harsh_reviewer", "novelty_expert", "optimist", "area_chair"];

export default function DebateTranscript({
  messages,
  agents = [],
}: {
  messages: DebateMessageDto[];
  agents?: DebateAgentDto[];
}) {
  const t = useTranslations("PaperTools.debate");
  const bottomRef = useRef<HTMLDivElement>(null);
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakerLabel = (agentId: string | null) => {
    const agent = agentId ? agentsById.get(agentId) : undefined;
    if (!agent) return t("personas.system");
    return KNOWN_PERSONAS.includes(agent.persona) ? t(`personas.${agent.persona}`) : agent.name;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded p-4 space-y-4">
      {messages.map((msg) => {
        const label = speakerLabel(msg.agentId);
        return (
          <div key={msg.id} className={`flex items-start gap-3 p-3 rounded ${msg.isConsensusProposal ? "bg-green-50" : "bg-gray-50"}`}>
            <AgentAvatar persona={label} name={label} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 mb-1">{t("round", { round: msg.round })}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
