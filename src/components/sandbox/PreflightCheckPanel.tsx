'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface PreflightProps {
  paperId: string;
  codeSnippet: string;
  dependencies: string[];
}

export function PreflightCheckPanel({ paperId, codeSnippet, dependencies }: PreflightProps) {
  const t = useTranslations('PaperTools.preflight');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [logs, setLogs] = useState<{ stdout?: string; stderr?: string; error?: string } | null>(null);
  const [code, setCode] = useState(codeSnippet);
  const [deps, setDeps] = useState<string[]>(dependencies);
  const [isFixing, setIsFixing] = useState(false);

  const runPreflight = async (codeToRun = code, depsToUse = deps) => {
    setStatus('running');
    setLogs(null);
    
    try {
      const res = await fetch('/api/preflight/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, code: codeToRun || undefined, dependencies: depsToUse })
      });
      
      const data = await res.json();
      if (data.code) setCode(data.code);
      
      if (data.success) {
        setStatus('success');
        setLogs({ stdout: data.stdout });
        toast.success(t('passed'));
      } else {
        setStatus('failed');
        setLogs({ stderr: data.stderr, error: data.error?.message });
        toast.error(data.error?.message || t('failedToast'));
      }
    } catch {
      setStatus('failed');
      setLogs({ error: t('networkError') });
    }
  };

  const handleAutoFix = async () => {
    if (!code || !(logs?.stderr || logs?.error)) return;
    setIsFixing(true);
    try {
      const res = await fetch('/api/sandbox/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, stderr: logs?.stderr || logs?.error, dependencies: deps }),
      });
      if (!res.ok) throw new Error(t('autoFixFailed'));
      const fix: { fixedCode: string; newDependencies: string[]; explanation: string } = await res.json();
      setCode(fix.fixedCode);
      setDeps(fix.newDependencies);
      toast.info(fix.explanation);
      await runPreflight(fix.fixedCode, fix.newDependencies);
    } catch {
      toast.error(t('autoFixFailed'));
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full mt-4 border-2">
      <CardHeader className="bg-slate-50 dark:bg-slate-900">
        <CardTitle className="flex items-center gap-2 text-lg">
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
          
          {status === 'idle' && (
            <Button onClick={() => runPreflight()} className="w-full">
              {t('run')}
            </Button>
          )}

          {status === 'running' && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 border rounded-md border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">{t('running')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-900 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="h-5 w-5" /> {t('success')}
              </div>
              <pre className="text-xs p-2 bg-white/50 dark:bg-black/50 rounded overflow-x-auto">
                {logs?.stdout || t('noOutput')}
              </pre>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <XCircle className="h-5 w-5" /> {t('failure')}
                </div>
                <pre className="text-xs p-2 bg-white/50 dark:bg-black/50 rounded overflow-x-auto text-red-600 dark:text-red-400">
                  {logs?.stderr || logs?.error || t('unknownError')}
                </pre>
              </div>
              
              <Button onClick={handleAutoFix} disabled={isFixing || !code} variant="secondary" className="w-full flex items-center gap-2">
                {isFixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />} {t('autoFix')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
