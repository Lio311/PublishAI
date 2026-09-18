'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Copy, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubmissionPanelProps {
  paperId: string;
  hasVerifiedCode: boolean;
  codeSnippet?: string;
  datasets?: { filename: string; url: string }[];
  requirements?: string[];
}

export function ExportAgentToggle({ paperId, hasVerifiedCode, codeSnippet = '', datasets = [], requirements = [] }: SubmissionPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [buildStatus, setBuildStatus] = useState<string | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportEnabled, setExportEnabled] = useState(false);
  const [repoId, setRepoId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (repoId && buildStatus !== 'RUNNING' && buildStatus !== 'FAILED') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/export-agent?repoId=${encodeURIComponent(repoId)}`);
          if (res.ok) {
            const data = await res.json();
            setBuildStatus(data.status);
            if (data.status === 'RUNNING') {
              toast.success('Agent deployment complete and running!');
              clearInterval(interval);
            } else if (data.status === 'FAILED') {
              toast.error('Space failed to build or run.');
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [repoId, buildStatus]);

  const handleExportToggle = async (checked: boolean) => {
    setExportEnabled(checked);
    
    if (checked) {
      if (!hasVerifiedCode) {
        toast.error('You must run the Pre-Flight Check on your code before exporting an agent.');
        setExportEnabled(false);
        return;
      }

      setIsExporting(true);
      setBuildStatus('INITIALIZING');
      
      try {
        const res = await fetch('/api/export-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId, code: codeSnippet, datasets, requirements })
        });
        
        const data = await res.json();
        
        if (data.success) {
          setExportedUrl(data.url);
          setRepoId(data.repoId);
          setBuildStatus('BUILDING');
          toast.success('Files committed. Waiting for Hugging Face build...');
        } else {
          toast.error(data.error || 'Failed to export agent.');
          setExportEnabled(false);
          setBuildStatus(null);
        }
      } catch (error) {
        toast.error('Network error during agent export.');
        setExportEnabled(false);
        setBuildStatus(null);
      } finally {
        setIsExporting(false);
      }
    } else {
      setExportedUrl(null);
      setRepoId(null);
      setBuildStatus(null);
    }
  };

  const copyToClipboard = () => {
    if (exportedUrl) {
      navigator.clipboard.writeText(`Interactive Agent: ${exportedUrl}`);
      toast.success('Copied to clipboard! Paste this in your Data Availability section.');
    }
  };

  return (
    <Card className="w-full mt-6 border-indigo-100 dark:border-indigo-900">
      <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-indigo-700 dark:text-indigo-400">
              <Bot className="h-5 w-5" /> Export Interactive Agent
            </CardTitle>
            <CardDescription className="mt-1">
              Package your paper, code, and datasets into a public MCP server on Hugging Face Spaces.
            </CardDescription>
          </div>
          <Switch 
            checked={exportEnabled} 
            onCheckedChange={handleExportToggle} 
            disabled={isExporting || buildStatus === 'BUILDING'}
          />
        </div>
      </CardHeader>
      
      {(isExporting || buildStatus === 'BUILDING' || buildStatus === 'INITIALIZING') && (
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <div className="text-center">
            <p className="font-medium text-sm">
              {buildStatus === 'BUILDING' ? 'Building Docker Container on Hugging Face...' : 'Uploading code and datasets...'}
            </p>
            <p className="text-xs text-muted-foreground">This may take a few minutes depending on dataset size.</p>
          </div>
        </CardContent>
      )}

      {exportedUrl && buildStatus === 'RUNNING' && (
        <CardContent className="p-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <Label className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Agent Deployed Successfully
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 px-3 py-2 bg-white dark:bg-black border rounded text-sm truncate">
                {exportedUrl}
              </code>
              <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy link">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => window.open(exportedUrl, '_blank')} title="Open Space">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Paste this link into your manuscript&apos;s Data Availability statement.
            </p>
          </div>
        </CardContent>
      )}
      
      {buildStatus === 'FAILED' && (
        <CardContent className="p-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <p className="font-semibold text-sm">Deployment Failed</p>
            <p className="text-xs mt-1">The Hugging Face space encountered a runtime error. Check your logs on Hugging Face.</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
