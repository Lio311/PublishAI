"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';

export default function RlhfPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    async function fetchEvaluations() {
      try {
        const res = await fetch('/api/rlhf/evaluations');
        const json = await res.json();
        if (json.data) {
          setEvaluations(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvaluations();
  }, []);

  const currentEval = evaluations[currentIndex];

  const handleRate = async (rating: number) => {
    if (!currentEval) return;
    try {
      await fetch(`/api/rlhf/evaluations/${currentEval.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, feedbackText }),
      });
      // automatically go to next
      setCurrentIndex((prev) => prev + 1);
      setFeedbackText("");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8">Loading evaluations...</div>;
  }

  if (!currentEval) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">RLHF Evaluations</h1>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center text-gray-500">
            No more evaluations to review. You are all caught up!
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">RLHF Evaluations</h1>
      <Card className="max-w-3xl mx-auto shadow-sm border">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b">
          <CardTitle className="text-lg">Agent: {currentEval.agentName}</CardTitle>
          <div className="text-xs text-gray-500 mt-1 font-mono">
            Eval ID: {currentEval.id} | Current Rating: {currentEval.rating ?? 'Unrated'}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Input Context</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-sm whitespace-pre-wrap font-mono border overflow-x-auto">
              {currentEval.inputContext}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">AI Output</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-sm whitespace-pre-wrap border overflow-x-auto">
              {currentEval.aiOutput}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Optional Feedback</h3>
            <textarea
              className="w-full p-3 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What did the agent do well/poorly?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4 bg-gray-50/30 dark:bg-gray-900/30">
          <div className="flex gap-4">
            <Button
              className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/50"
              onClick={() => handleRate(1)}
            >
              <ThumbsUp className="w-4 h-4" />
              Good (+1)
            </Button>
            <Button
              className="flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50"
              onClick={() => handleRate(-1)}
            >
              <ThumbsDown className="w-4 h-4" />
              Bad (-1)
            </Button>
          </div>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => {
              setCurrentIndex((prev) => prev + 1);
              setFeedbackText("");
            }}
          >
            Skip <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
      <div className="max-w-3xl mx-auto mt-4 text-center text-sm text-gray-500">
        Reviewing {currentIndex + 1} of {evaluations.length} recent evaluations
      </div>
    </div>
  );
}
