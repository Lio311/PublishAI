import React, { useState } from 'react';

interface HumanInterventionModalProps {
  isOpen: boolean;
  message: string;
  onResume: (input?: string) => void;
  onClose: () => void;
}

export const HumanInterventionModal: React.FC<HumanInterventionModalProps> = ({
  isOpen,
  message,
  onResume,
  onClose,
}) => {
  const [userInput, setUserInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-yellow-50">
          <h2 className="text-lg font-semibold text-yellow-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Human Intervention Required
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            &times;
          </button>
        </div>
        
        <div className="p-6 flex-grow">
          <p className="text-gray-700 mb-4">{message || "The bot requires your attention to proceed."}</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intervention-input">
              Provide necessary input (optional)
            </label>
            <input
              id="intervention-input"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., confirmation code, extra details"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onResume(userInput);
              setUserInput('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center"
          >
            Resume Bot
          </button>
        </div>
      </div>
    </div>
  );
};
