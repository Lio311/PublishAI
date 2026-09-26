"use client";

import React, { useEffect, useState } from "react";

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
}

export default function EntityHighlighter({ text }: { text: string }) {
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    // In a real app we might pass the text to an API and get entities present in this text.
    // Here we just fetch all global entities and naive match them.
    fetch("/api/graph/entities")
      .then(res => res.json())
      .then(setEntities)
      .catch(console.error);
  }, []);

  const highlightText = (content: string, ents: Entity[]) => {
    if (!ents || ents.length === 0) return content;
    
    // Sort entities by length descending to avoid partial matches on shorter words
    const sorted = [...ents].sort((a, b) => b.name.length - a.name.length);
    
    // Create regex pattern
    const pattern = new RegExp(`\\b(${sorted.map(e => escapeRegExp(e.name)).join('|')})\\b`, 'gi');
    
    const parts = content.split(pattern);
    
    return parts.map((part, i) => {
      const lowerPart = part.toLowerCase();
      const matchedEntity = sorted.find(e => e.name.toLowerCase() === lowerPart);
      
      if (matchedEntity) {
        return (
          <span 
            key={i} 
            className="bg-yellow-200 cursor-pointer border-b border-yellow-500 relative group"
            title={`${matchedEntity.name} (${matchedEntity.type})\\n${matchedEntity.description || ''}`}
          >
            {part}
            <span className="hidden group-hover:block absolute bottom-full left-0 bg-black text-white text-xs p-2 rounded w-48 z-10">
              <span className="font-bold">{matchedEntity.name}</span> ({matchedEntity.type})
              {matchedEntity.description && <><br/>{matchedEntity.description}</>}
            </span>
          </span>
        );
      }
      return part;
    });
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
  }

  return (
    <div className="leading-relaxed p-4 bg-white border rounded">
      {highlightText(text, entities)}
    </div>
  );
}
