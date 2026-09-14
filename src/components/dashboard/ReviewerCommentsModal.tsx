import { useState } from "react";

interface ReviewerCommentsModalProps {
  paperId: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comments: string) => void;
}

export function ReviewerCommentsModal({ paperId, isOpen, onClose, onSubmit }: ReviewerCommentsModalProps) {
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // In a real app we'd call an API route here which triggers the Inngest event
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSubmit(comments);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Submit Reviewer Comments</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4">
            Paste the feedback received from the journal reviewers below. Our Rebuttal Agent will analyze these comments and propose a "Response to Reviewers" strategy.
          </p>
          <textarea
            className="w-full h-64 p-4 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Reviewer 1:&#10;The methodology section lacks detail regarding the sampling technique...&#10;&#10;Reviewer 2:&#10;Figure 3 is unclear..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!comments.trim() || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 rounded-md hover:from-blue-500 hover:via-sky-500 hover:to-sky-400 disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              "Generate Rebuttal Strategy"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
