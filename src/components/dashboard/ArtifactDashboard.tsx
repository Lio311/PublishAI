"use client";

import { useState } from "react";
import DiffEditor from "./DiffEditor";
import ReviewPanel from "./ReviewPanel";
import { ReviewerCommentsModal } from "./ReviewerCommentsModal";
import { toast } from "sonner";
import { FileDown, GitMerge, FileCheck2, Send } from "lucide-react";

interface ArtifactDashboardProps {
  paperId: string;
  originalText: string;
  modifiedText: string;
  peerReviewReport?: string;
  onApproveAll: () => void;
}

type Tab = "diff" | "review" | "export";

export default function ArtifactDashboard({ paperId, originalText, modifiedText, peerReviewReport, onApproveAll }: ArtifactDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("diff");
  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);

  const handleReviewerCommentsSubmit = async (comments: string) => {
    try {
      const res = await fetch("/api/papers/reviewer-comments", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ paperId, comments }) 
      });
      if(res.ok) toast.success("Reviewer comments submitted. AI is working on a rebuttal strategy.");
      else toast.error("Failed to submit comments.");
    } catch(e) { toast.error("Error submitting comments."); }
  };


  return (
    <div className="flex flex-col h-[800px] bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 bg-slate-50 rounded-t-xl px-4 pt-4 gap-2">
        <button
          onClick={() => setActiveTab("diff")}
          className={`px-4 py-2 font-medium rounded-t-lg flex items-center gap-2 ${
            activeTab === "diff" ? "bg-white text-indigo-600 border-t border-x border-slate-200 mb-[-1px]" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <GitMerge className="w-4 h-4" />
          Track Changes
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 font-medium rounded-t-lg flex items-center gap-2 ${
            activeTab === "review" ? "bg-white text-indigo-600 border-t border-x border-slate-200 mb-[-1px]" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Peer Review Report
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`px-4 py-2 font-medium rounded-t-lg flex items-center gap-2 ${
            activeTab === "export" ? "bg-white text-indigo-600 border-t border-x border-slate-200 mb-[-1px]" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <FileDown className="w-4 h-4" />
          Export & Submit
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden p-4 bg-slate-50/50">
        {activeTab === "diff" && (
          <DiffEditor 
            originalText={originalText} 
            modifiedText={modifiedText} 
            onAccept={onApproveAll} 
            onReject={() => alert("Revisions rejected.")} 
          />
        )}
        
        {activeTab === "review" && (
          <div className="h-full overflow-y-auto">
            <ReviewPanel 
              title="Simulated Peer Review Report" 
              content={peerReviewReport || "Review report is still being generated..."} 
            />
          </div>
        )}

        {activeTab === "export" && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Ready to Publish?</h2>
            <p className="text-slate-600 text-center max-w-md">
              Your manuscript has been fully revised and approved. You can now download it in your preferred format or submit it directly to your target journal.
            </p>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">
                <FileDown className="w-5 h-5" /> Download DOCX
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">
                <FileDown className="w-5 h-5" /> Download PDF
              </button>
              
            <button 
              onClick={() => setIsReviewerModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 rounded-lg text-white font-medium hover:from-blue-800 hover:via-blue-600 hover:to-sky-300 ml-2">
              <FileDown className="w-4 h-4" /> {/* Or a message icon */}
              Submit Reviewer Comments
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 rounded-lg text-white font-medium hover:from-blue-800 hover:via-blue-600 hover:to-sky-300 ml-2">
                <Send className="w-5 h-5" /> Auto-Submit to Journal
              </button>
            </div>
          </div>
        )}
      </div>
      <ReviewerCommentsModal paperId={Number(paperId)} isOpen={isReviewerModalOpen} onClose={() => setIsReviewerModalOpen(false)} onSubmit={handleReviewerCommentsSubmit} />
    </div>
  );
}
