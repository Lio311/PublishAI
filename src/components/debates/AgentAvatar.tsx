import React from "react";

export default function AgentAvatar({ persona, name }: { persona: string; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-1">
        {name.charAt(0)}
      </div>
      <span className="text-xs text-gray-500">{persona}</span>
    </div>
  );
}
