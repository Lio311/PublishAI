'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface DebateTurn {
  speaker: string;
  message: string;
}

export function MultiAgentDebatePanel({ userFindings }: { userFindings: string }) {
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [synthesis, setSynthesis] = useState<string | null>(null);

  const startDebate = async () => {
    setIsDebating(true);
    setTurns([]);
    setSynthesis(null);

    toast.info('Initiating Multi-Agent Discussion Panel...');

    try {
      // In production, this uses SSE (Server-Sent Events) to stream the debate.
      // For this MVP, we simulate a polling or single fetch that streams back chunks.
      const res = await fetch('/api/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings: userFindings, benchmarkPapers: ['PaperA', 'PaperB', 'PaperC'] })
      });

      const data = await res.json();
      
      // Simulate real-time typing effect for the sake of the UI
      for (const turn of data.turns) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setTurns(prev => [...prev, turn]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSynthesis(data.synthesis);
      
    } catch (error) {
      toast.error('Failed to orchestrate debate.');
    } finally {
      setIsDebating(false);
    }
  };

  const insertToEditor = () => {
    // In PublishAI, this would dispatch to TipTap context
    toast.success('Discussion section drafted and inserted into the editor!');
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" /> AI Discussion Panel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        {turns.length === 0 && !isDebating ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
            <p className="text-muted-foreground max-w-md">
              Deploy a swarm of autonomous AI agents instantiated from your benchmark papers. They will debate your findings and collaboratively draft the Discussion section.
            </p>
            <Button onClick={startDebate} size="lg" className="mt-4">Start Panel</Button>
          </div>
        ) : (
          <ScrollArea className="h-full p-6">
            <div className="space-y-6">
              {/* User Findings Prompt */}
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-sm">
                  <span className="font-semibold block mb-1">Your Findings</span>
                  {userFindings}
                </div>
              </div>

              {/* Agent Turns */}
              {turns.map((turn, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm">
                    <span className="font-semibold block mb-1 text-purple-700 dark:text-purple-400">
                      {turn.speaker}
                    </span>
                    {turn.message}
                  </div>
                </div>
              ))}

              {isDebating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse ml-12">
                  <Bot className="h-4 w-4" /> Agents are deliberating...
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {synthesis && (
        <CardFooter className="bg-indigo-50 dark:bg-indigo-950/20 border-t p-4 flex flex-col items-start gap-4">
          <div className="text-sm">
            <span className="font-semibold block mb-1 text-indigo-700 dark:text-indigo-400">Synthesized Discussion Draft</span>
            <p className="text-muted-foreground line-clamp-3">{synthesis}</p>
          </div>
          <Button onClick={insertToEditor} className="w-full bg-indigo-600 hover:bg-indigo-700">
            Insert Draft into Editor
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
