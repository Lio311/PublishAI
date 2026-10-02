import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { HumanInterventionModal } from './HumanInterventionModal';

interface SubmissionTrackerProps {
  paperId: number;
}

type JobStatus = 'initializing' | 'logging_in' | 'uploading' | 'filling_forms' | 'paused' | 'completed' | 'failed' | 'error';

interface JobDetails {
  jobId: string;
  status: JobStatus;
  messageKey?: 'running' | 'needs2fa' | 'needsCaptcha' | 'failed' | 'completed' | 'resuming';
  errorDetail?: string | null;
  progress?: number;
  interventionKind?: 'captcha' | '2fa' | null;
}

const TERMINAL_STATUSES: JobStatus[] = ['completed', 'failed', 'error'];
const POLL_INTERVAL_MS = 3000;

/** Tracks the paper's latest automated (RPA) submission; renders nothing if there is none. */
export const SubmissionTracker: React.FC<SubmissionTrackerProps> = ({ paperId }) => {
  const t = useTranslations('PaperTools.tracker');
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jobId = jobDetails?.jobId;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const response = await fetch(`/api/papers/${paperId}/rpa-job`);
        if (!response.ok) throw new Error('Failed to fetch job status');
        const { job } = (await response.json()) as { job: JobDetails | null };
        if (cancelled) return;

        setJobDetails(job);
        setError(null);
        if (!job) return;
        if (job.status === 'paused') setIsModalOpen(true);
        if (!TERMINAL_STATUSES.includes(job.status)) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        console.error("Error polling status:", err);
        if (!cancelled) setError(t('errors.track'));
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [paperId]);

  const handleResume = async (input?: string) => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/rpa/resume/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || t('errors.resume'));
      }

      setIsModalOpen(false);
      setJobDetails(prev => prev && ({ ...prev, status: 'logging_in', messageKey: 'resuming' }));
    } catch (err) {
      console.error("Failed to resume bot:", err);
      setError(err instanceof Error ? err.message : t('errors.resume'));
    }
  };

  if (!jobDetails) return null;

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed':
      case 'error': return 'text-red-600 bg-red-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getProgressWidth = (status: JobStatus, progress?: number) => {
    if (progress !== undefined) return `${progress}%`;
    switch (status) {
      case 'initializing': return '10%';
      case 'logging_in': return '30%';
      case 'uploading': return '50%';
      case 'filling_forms': return '70%';
      case 'paused': return '75%';
      case 'completed': return '100%';
      case 'failed':
      case 'error': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('jobId', { id: jobId ?? '' })}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(jobDetails.status)}`}>
          {t(`status.${jobDetails.status}`)}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-2 flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">
          {t(`messages.${jobDetails.messageKey ?? 'running'}`)}
          {jobDetails.errorDetail ? `: ${jobDetails.errorDetail}` : ''}
        </span>
        <span className="text-gray-500">{getProgressWidth(jobDetails.status, jobDetails.progress)}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ease-in-out ${
            jobDetails.status === 'completed' ? 'bg-green-500' :
            jobDetails.status === 'failed' || jobDetails.status === 'error' ? 'bg-red-500' :
            jobDetails.status === 'paused' ? 'bg-yellow-500' : 'bg-blue-600'
          }`}
          style={{ width: getProgressWidth(jobDetails.status, jobDetails.progress) }}
        ></div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm text-gray-500">
        <div className={jobDetails.status === 'logging_in' || getProgressValue(jobDetails.status) >= 30 ? 'text-blue-600 font-semibold' : ''}>
          {t('steps.login')}
        </div>
        <div className={jobDetails.status === 'uploading' || getProgressValue(jobDetails.status) >= 50 ? 'text-blue-600 font-semibold' : ''}>
          {t('steps.upload')}
        </div>
        <div className={jobDetails.status === 'filling_forms' || getProgressValue(jobDetails.status) >= 70 ? 'text-blue-600 font-semibold' : ''}>
          {t('steps.forms')}
        </div>
        <div className={jobDetails.status === 'completed' ? 'text-green-600 font-semibold' : ''}>
          {t('steps.complete')}
        </div>
      </div>

      <HumanInterventionModal 
        isOpen={isModalOpen}
        message={t(`messages.${jobDetails.messageKey === 'needs2fa' ? 'needs2fa' : 'needsCaptcha'}`)}
        onResume={handleResume}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

// Helper function for UI states
const getProgressValue = (status: JobStatus): number => {
  switch (status) {
    case 'initializing': return 10;
    case 'logging_in': return 30;
    case 'uploading': return 50;
    case 'filling_forms': return 70;
    case 'paused': return 75;
    case 'completed': return 100;
    case 'failed':
    case 'error': return 100;
    default: return 0;
  }
};

