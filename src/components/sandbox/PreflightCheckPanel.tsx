'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';

interface PreflightProps {
  paperId: string;
  codeSnippet: string;
  dependencies: string[];
}

export function PreflightCheckPanel({ paperId, codeSnippet, dependencies }: PreflightProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [logs, setLogs] = useState<{ stdout?: string; stderr?: string; error?: string } | null>(null);

  const runPreflight = async () => {
    setStatus('running');
    setLogs(null);
    
    try {
      // In a real app, this would trigger an Inngest event via an API route
      // and we would poll or listen to SSE for the result.
      // For MVP, we simulate the API call to the backend which triggers Inngest.
      const res = await fetch('/api/preflight/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, code: codeSnippet, dependencies })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus('success');
        setLogs({ stdout: data.stdout });
        toast.success('Pre-Flight Check Passed! Code is fully reproducible.');
      } else {
        setStatus('failed');
        setLogs({ stderr: data.stderr, error: data.error?.message });
        toast.error('Pre-Flight Check Failed. Missing dependencies or syntax errors.');
      }
    } catch (error) {
      setStatus('failed');
      setLogs({ error: 'Network error occurred during pre-flight check.' });
    }
  };

  const handleAutoFix = () => {
    toast.info('Triggering AI Auto-Fix... analyzing stack trace and rewriting dependencies.');
    // Trigger fixCodeAgent...
  };

  return (
    <Card className="w-full mt-4 border-2">
      <CardHeader className="bg-slate-50 dark:bg-slate-900">
        <CardTitle className="flex items-center gap-2 text-lg">
          Reproducibility Sandbox
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Run a secure pre-flight execution of your supplementary code to guarantee it works for peer reviewers.
          </p>
          
          {status === 'idle' && (
            <Button onClick={runPreflight} className="w-full">
              Run Pre-Flight Check
            </Button>
          )}

          {status === 'running' && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 border rounded-md border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Provisioning E2B MicroVM and executing code...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-900 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="h-5 w-5" /> Execution Successful
              </div>
              <pre className="text-xs p-2 bg-white/50 dark:bg-black/50 rounded overflow-x-auto">
                {logs?.stdout || 'No standard output produced.'}
              </pre>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <XCircle className="h-5 w-5" /> Execution Failed
                </div>
                <pre className="text-xs p-2 bg-white/50 dark:bg-black/50 rounded overflow-x-auto text-red-600 dark:text-red-400">
                  {logs?.stderr || logs?.error || 'Unknown error occurred.'}
                </pre>
              </div>
              
              <Button onClick={handleAutoFix} variant="secondary" className="w-full flex items-center gap-2">
                <Wrench className="h-4 w-4" /> ✨ AI Auto-Fix Dependencies
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
