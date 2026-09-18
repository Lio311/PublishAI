import { useState, useEffect } from 'react';
import type { SubmissionItem } from '@/components/SubmissionDashboard';

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/submissions');
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const retrySubmission = async (id: string | number) => {
    // Optimistic update
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, status: 'submitting', attemptCount: (sub.attemptCount || 0) + 1 } : sub
      )
    );

    try {
      const res = await fetch(`/api/submissions/${id}/retry`, { method: 'POST' });
      if (!res.ok) throw new Error('Retry failed');
      
      // Re-fetch or update with real data from server
      await fetchSubmissions();
    } catch (err) {
      // Revert on failure
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id ? { ...sub, status: 'failed', errorLog: 'Retry failed' } : sub
        )
      );
    }
  };

  return {
    submissions,
    isLoading,
    error,
    retrySubmission,
    refetch: fetchSubmissions
  };
}
