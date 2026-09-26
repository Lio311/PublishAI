import React, { useState, useEffect } from 'react';
import { HumanInterventionModal } from './HumanInterventionModal';

interface SubmissionTrackerProps {
  jobId: string;
}

type JobStatus = 'initializing' | 'logging_in' | 'uploading' | 'filling_forms' | 'paused' | 'completed' | 'failed' | 'error';

interface JobDetails {
  status: JobStatus;
  message?: string;
  progress?: number;
}

export const SubmissionTracker: React.FC<SubmissionTrackerProps> = ({ jobId }) => {
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    status: 'initializing',
    progress: 0,
    message: 'Initializing submission...',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Polling function to check bot status
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/rpa/status/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }
        const data = await response.json();
        
        setJobDetails(data);
        
        if (data.status === 'paused') {
          setIsModalOpen(true);
        } else if (data.status === 'completed' || data.status === 'failed' || data.status === 'error') {
          // Stop polling if terminal state
          return true; // indicates done
        }
        
        return false;
      } catch (err) {
        console.error("Error polling status:", err);
        setError("Failed to track submission status.");
        return true; // stop polling on error
      }
    };

    let timeoutId: NodeJS.Timeout;
    
    const runPoll = async () => {
      const isDone = await pollStatus();
      if (!isDone) {
        timeoutId = setTimeout(runPoll, 3000); // poll every 3 seconds
      }
    };
    
    runPoll();

    return () => clearTimeout(timeoutId);
  }, [jobId]);

  const handleResume = async (input?: string) => {
    try {
      await fetch(`/api/rpa/resume/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });
      console.log(`Resuming job ${jobId} with input: ${input}`);
      
      setIsModalOpen(false);
      setJobDetails(prev => ({ ...prev, status: 'uploading', message: 'Resuming process...' }));
      // The polling will naturally pick up the new status
    } catch (err) {
      console.error("Failed to resume bot:", err);
      setError("Failed to resume the bot.");
    }
  };

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
          <h2 className="text-xl font-bold text-gray-800">Automated Submission Tracker</h2>
          <p className="text-sm text-gray-500 mt-1">Job ID: {jobId}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(jobDetails.status)}`}>
          {jobDetails.status.replace('_', ' ')}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-2 flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{jobDetails.message || 'Processing...'}</span>
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
          Login
        </div>
        <div className={jobDetails.status === 'uploading' || getProgressValue(jobDetails.status) >= 50 ? 'text-blue-600 font-semibold' : ''}>
          Upload Files
        </div>
        <div className={jobDetails.status === 'filling_forms' || getProgressValue(jobDetails.status) >= 70 ? 'text-blue-600 font-semibold' : ''}>
          Fill Forms
        </div>
        <div className={jobDetails.status === 'completed' ? 'text-green-600 font-semibold' : ''}>
          Complete
        </div>
      </div>

      <HumanInterventionModal 
        isOpen={isModalOpen}
        message={jobDetails.message || "Please complete the requested action to continue."}
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

