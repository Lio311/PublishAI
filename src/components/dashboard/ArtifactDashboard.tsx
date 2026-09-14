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
    <div className="flex flex-col h-[800px] bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/50 overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200/50 bg-slate-50/30 px-6 pt-4 gap-2">
        <button
          onClick={() => setActiveTab("diff")}
          className={`px-5 py-2.5 font-medium rounded-t-xl flex items-center gap-2 transition-all duration-300 ${
            activeTab === "diff" 
              ? "bg-white/90 text-blue-800 shadow-[0_-4px_12px_rgba(0,0,0,0.02)] mb-[-1px] border-t border-x border-white/60 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/30"
          }`}
        >
          <GitMerge className="w-4 h-4" />
          Track Changes
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-5 py-2.5 font-medium rounded-t-xl flex items-center gap-2 transition-all duration-300 ${
            activeTab === "review" 
              ? "bg-white/90 text-blue-800 shadow-[0_-4px_12px_rgba(0,0,0,0.02)] mb-[-1px] border-t border-x border-white/60 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/30"
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Review Report
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`px-5 py-2.5 font-medium rounded-t-xl flex items-center gap-2 transition-all duration-300 ${
            activeTab === "export" 
              ? "bg-white/90 text-blue-800 shadow-[0_-4px_12px_rgba(0,0,0,0.02)] mb-[-1px] border-t border-x border-white/60 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/30"
          }`}
        >
          <Send className="w-4 h-4" />
          Export & Submit
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 bg-white/30">
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 rounded-lg text-white font-medium hover:from-blue-500 hover:via-sky-500 hover:to-sky-400 ml-2">
              <FileDown className="w-4 h-4" /> {/* Or a message icon */}
              Submit Reviewer Comments
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 rounded-lg text-white font-medium hover:from-blue-500 hover:via-sky-500 hover:to-sky-400 ml-2">
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
