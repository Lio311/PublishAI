import React, { useState, useCallback } from 'react';

export interface JournalRecommendation {
  id: string;
  name: string;
  impactFactor?: number;
  matchScore: number;
  rationale: string;
}

export interface RejectStateHandlerProps {
  paperTitle: string;
  originalJournal: string;
  recommendations: JournalRecommendation[];
  onReformatRequest?: (journalId: string) => Promise<void>;
}

export default function RejectStateHandler({
  paperTitle,
  originalJournal,
  recommendations,
  onReformatRequest,
}: RejectStateHandlerProps) {
  const [isReformatting, setIsReformatting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReformat = useCallback(async (journalId: string) => {
    if (!onReformatRequest) return;
    
    setIsReformatting(journalId);
    setError(null);
    setSuccess(null);
    
    try {
      await onReformatRequest(journalId);
      setSuccess(journalId);
    } catch (err) {
      setError(journalId);
    } finally {
      setIsReformatting(null);
    }
  }, [onReformatRequest]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Rejection Notice */}
      <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
        <h2 className="text-xl font-semibold text-red-800 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Submission Rejected
        </h2>
        <p className="mt-2 text-red-700">
          Unfortunately, your submission <span className="font-semibold italic">"{paperTitle}"</span> has been rejected by <span className="font-semibold">{originalJournal}</span>. 
        </p>
        <p className="mt-1 text-red-700 text-sm">
          Don't be discouraged. We've analyzed the feedback and found several high-quality alternative journals that are a strong match for your research.
        </p>
      </div>

      {/* Alternative Journal Recommendations */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Recommended Alternative Journals</h3>
        
        {recommendations.length === 0 ? (
          <p className="text-gray-500 italic">No recommendations available at this time.</p>
        ) : (
          <div className="grid gap-4">
            {recommendations.map((journal) => {
              const isLoading = isReformatting === journal.id;
              const isSuccess = success === journal.id;
              const isError = error === journal.id;

              return (
                <div key={journal.id} className="p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-md font-bold text-gray-900">{journal.name}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {journal.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{journal.rationale}</p>
                    {journal.impactFactor && (
                      <p className="text-xs text-gray-500 font-medium">Impact Factor: {journal.impactFactor}</p>
                    )}
                  </div>
                  
                  <div className="w-full sm:w-auto flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleReformat(journal.id)}
                      disabled={isLoading || isSuccess}
                      className={`
                        w-full sm:w-auto px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all
                        ${isLoading ? 'bg-blue-100 text-blue-700 cursor-not-allowed' : ''}
                        ${isSuccess ? 'bg-green-600 text-white cursor-default' : ''}
                        ${!isLoading && !isSuccess ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2' : ''}
                      `}
                    >
                      {isLoading && (
                        <svg className="animate-spin h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {!isLoading && isSuccess && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isLoading ? 'Reformatting AI...' : isSuccess ? 'Reformated!' : 'Select & Reformat'}
                    </button>
                    {isError && (
                      <span className="text-xs text-red-600 font-medium text-center">Failed. Try again.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
