"use client";

import { useState } from "react";
import { DiffEditor } from "./DiffEditor";
import { ReviewPanel, ReviewItem } from "./ReviewPanel";
import { FileText, Download, FileArchive } from "lucide-react";

interface ArtifactDashboardProps {
  originalText: string;
  revisedText: string;
  reviews: ReviewItem[];
  coverLetter?: string;
}

export function ArtifactDashboard({ originalText, revisedText, reviews, coverLetter }: ArtifactDashboardProps) {
  const [activeTab, setActiveTab] = useState<"manuscript" | "reviews" | "cover-letter">("manuscript");

  return (
    <div className="flex flex-col h-[800px]">
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-t-lg border border-b-0 border-slate-200">
        <button
          onClick={() => setActiveTab("manuscript")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "manuscript" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Revised Manuscript
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "reviews" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <FileArchive className="w-4 h-4" />
          Peer Review
        </button>
        <button
          onClick={() => setActiveTab("cover-letter")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "cover-letter" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Cover Letter
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-b-lg overflow-hidden">
        {activeTab === "manuscript" && (
          <DiffEditor 
            original={originalText} 
            modified={revisedText} 
            onAccept={() => alert("Changes accepted!")} 
          />
        )}
        
        {activeTab === "reviews" && (
          <ReviewPanel reviews={reviews} />
        )}
        
        {activeTab === "cover-letter" && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Generated Cover Letter</h3>
              <button className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <Download className="w-4 h-4" />
                Export DOCX
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto bg-white">
              <div className="max-w-3xl mx-auto prose prose-slate">
                {coverLetter ? (
                  <div dangerouslySetInnerHTML={{ __html: coverLetter.replace(/\n/g, '<br/>') }} />
                ) : (
                  <p className="text-slate-500 text-center mt-10">Cover letter not yet generated.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
