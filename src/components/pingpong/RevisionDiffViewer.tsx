import React from 'react';

interface RevisionDiffViewerProps {
  originalContent: string;
  newContent: string;
}

export const RevisionDiffViewer: React.FC<RevisionDiffViewerProps> = ({ originalContent, newContent }) => {
  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-medium text-gray-800">Revision Diff</h3>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Original Content */}
        <div className="flex-1 border border-red-200 rounded-md overflow-hidden flex flex-col">
          <div className="bg-red-100 text-red-800 px-4 py-2 font-semibold border-b border-red-200">
            Original
          </div>
          <div className="p-4 bg-red-50 text-red-900 whitespace-pre-wrap font-mono text-sm overflow-x-auto flex-1 max-h-[600px] overflow-y-auto">
            {originalContent || <span className="italic text-red-400">No original content</span>}
          </div>
        </div>

        {/* New Content */}
        <div className="flex-1 border border-green-200 rounded-md overflow-hidden flex flex-col">
          <div className="bg-green-100 text-green-800 px-4 py-2 font-semibold border-b border-green-200">
            Revised
          </div>
          <div className="p-4 bg-green-50 text-green-900 whitespace-pre-wrap font-mono text-sm overflow-x-auto flex-1 max-h-[600px] overflow-y-auto">
            {newContent || <span className="italic text-green-400">No revised content</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
