"use client";

import React, { useEffect, useState } from "react";

export default function PromptStrategyManager() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [newStrategy, setNewStrategy] = useState({ name: "", promptTemplate: "" });

  useEffect(() => {
    fetch("/api/rlhf/prompt-strategies")
      .then(res => res.json())
      .then(data => setStrategies(Array.isArray(data) ? data : []));
  }, []);

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch("/api/rlhf/prompt-strategies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive })
    });
    setStrategies(strategies.map(s => s.id === id ? { ...s, isActive } : s));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/rlhf/prompt-strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStrategy)
    });
    if (res.ok) {
      const created = await res.json();
      setStrategies([...strategies, created]);
      setNewStrategy({ name: "", promptTemplate: "" });
    }
  };

  return (
    <div className="border rounded p-4 bg-white dark:bg-gray-800">
      <form onSubmit={handleCreate} className="mb-6 flex gap-2 flex-col">
        <input 
          type="text" 
          placeholder="Strategy Name" 
          className="border p-2 rounded"
          value={newStrategy.name}
          onChange={e => setNewStrategy({...newStrategy, name: e.target.value})}
          required
        />
        <textarea 
          placeholder="Prompt Template..." 
          className="border p-2 rounded h-24"
          value={newStrategy.promptTemplate}
          onChange={e => setNewStrategy({...newStrategy, promptTemplate: e.target.value})}
          required
        />
        <button type="submit" className="bg-sky-500 text-white px-4 py-2 rounded w-fit">
          Add Strategy
        </button>
      </form>

      <div className="space-y-4">
        {strategies.map(strategy => (
          <div key={strategy.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <h3 className="font-semibold">{strategy.name}</h3>
              <p className="text-sm text-gray-500 truncate max-w-xs">{strategy.promptTemplate}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm">{strategy.isActive ? 'Active' : 'Inactive'}</span>
              <input 
                type="checkbox" 
                checked={strategy.isActive} 
                onChange={(e) => handleToggle(strategy.id, e.target.checked)}
                className="w-5 h-5"
              />
            </label>
          </div>
        ))}
        {strategies.length === 0 && <p className="text-gray-500 text-sm">No strategies found.</p>}
      </div>
    </div>
  );
}
