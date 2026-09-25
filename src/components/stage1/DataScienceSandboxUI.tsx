'use client';

import React, { useState } from 'react';

interface LogEntry {
  id: string;
  type: 'info' | 'code' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

export default function DataScienceSandboxUI() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [plots, setPlots] = useState<string[]>([]); // URLs or base64 strings of plots

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setIsUploading(true);
    // Simulate upload and AI processing
    const newLogs: LogEntry[] = [
      { id: '1', type: 'info', message: 'Uploading CSV file...', timestamp: new Date() },
      { id: '2', type: 'info', message: 'Analyzing data structure...', timestamp: new Date(Date.now() + 1000) },
      { id: '3', type: 'code', message: 'import pandas as pd\ndf = pd.read_csv("data.csv")\nprint(df.head())', timestamp: new Date(Date.now() + 2000) },
      { id: '4', type: 'success', message: 'Data loaded successfully. 1500 rows, 12 columns.', timestamp: new Date(Date.now() + 3000) },
      { id: '5', type: 'code', message: 'import matplotlib.pyplot as plt\nimport seaborn as sns\n\nplt.figure(figsize=(10, 6))\nsns.histplot(data=df, x="revenue")\nplt.title("Revenue Distribution")', timestamp: new Date(Date.now() + 4000) },
    ];
    
    setTimeout(() => {
      setLogs(newLogs);
      setIsUploading(false);
      // Simulate generating a plot (placeholder)
      setPlots(['https://placehold.co/600x400/f3f4f6/6b7280?text=Revenue+Distribution+Plot']);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Research & Data Science Sandbox</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Dataset (CSV)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`mt-7 px-6 py-2 rounded-md font-medium text-white transition-colors
              ${(!file || isUploading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isUploading ? 'Processing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Terminal/Log Area */}
        <div className="flex-1 flex flex-col bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-xs text-gray-400 font-mono">Agent Terminal</span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">Waiting for execution...</div>
            ) : (
              <div className="flex flex-col gap-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex flex-col">
                    <span className="text-gray-500 text-xs">[{log.timestamp.toLocaleTimeString()}]</span>
                    {log.type === 'info' && <span className="text-blue-400">{log.message}</span>}
                    {log.type === 'success' && <span className="text-green-400">{log.message}</span>}
                    {log.type === 'error' && <span className="text-red-400">{log.message}</span>}
                    {log.type === 'code' && (
                      <pre className="mt-1 bg-gray-950 p-2 rounded text-gray-300 whitespace-pre-wrap">
                        {log.message}
                      </pre>
                    )}
                  </div>
                ))}
                {isUploading && (
                  <div className="text-gray-400 animate-pulse mt-2">Agent is thinking...</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Output/Plots Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-700">Output Visualizations</h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
            {plots.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No visualizations generated yet
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {plots.map((plot, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={plot} alt={`Generated plot ${index + 1}`} className="max-w-full h-auto rounded" />
                    <span className="mt-2 text-sm text-gray-500">Figure {index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
