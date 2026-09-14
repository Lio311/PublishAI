import React, { useRef, useEffect } from "react";
import AgentAvatar from "./AgentAvatar";

export default function DebateTranscript({ messages }: { messages: any[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded p-4 space-y-4">
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex items-start gap-3 p-3 rounded ${msg.isConsensusProposal ? 'bg-green-50' : 'bg-gray-50'}`}>
          <AgentAvatar persona={msg.agentId ? "Agent" : "System"} name={msg.agentId ? "A" : "S"} />
          <div>
            <p className="text-sm text-gray-700">{msg.content}</p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
