import React, { useState } from 'react';

interface RevisionRequestFormProps {
  onSubmit: (feedback: string, autoReply: boolean) => void;
  isLoading?: boolean;
}

export const RevisionRequestForm: React.FC<RevisionRequestFormProps> = ({ onSubmit, isLoading }) => {
  const [feedback, setFeedback] = useState('');
  const [autoReply, setAutoReply] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(feedback, autoReply);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Submit Reviewer Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
            Reviewer Feedback (Ping)
          </label>
          <textarea
            id="feedback"
            className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Paste the reviewer feedback here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center">
          <input
            id="auto-reply"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={autoReply}
            onChange={(e) => setAutoReply(e.target.checked)}
          />
          <label htmlFor="auto-reply" className="ml-2 block text-sm text-gray-900">
            Enable Auto-Reply Revisions (generate and apply changes automatically)
          </label>
        </div>
        <button
          type="submit"
          disabled={isLoading || !feedback.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Processing...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};
