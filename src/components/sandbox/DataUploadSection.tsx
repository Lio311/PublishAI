"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export function DataUploadSection({ paperId }: { paperId: number }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("paperId", paperId.toString());

      const res = await fetch("/api/upload-data", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      setMessage({
        text: `Uploaded "${file.name}" successfully. Python sandbox replication has been queued.`,
        type: "success",
      });
    } catch (err: any) {
      setMessage({
        text: "Error: " + (err.message || "Failed to upload file."),
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-100 text-teal-600">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Upload Raw Dataset for Sandbox Replication</h3>
          <p className="text-xs text-slate-500">
            Attach CSV or Excel data sheets to allow the Python sandbox to independently verify statistical calculations and reconstruct plots
          </p>
        </div>
      </div>

      <div
        className={`border-2 border-dashed p-8 text-center rounded-2xl transition-all ${
          isDragging
            ? "border-teal-500 bg-teal-50/50 scale-[1.005]"
            : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700 mb-1">
          Drag and drop your CSV or Excel files here
        </p>
        <p className="text-xs text-slate-400 mb-4">Supports .csv, .xlsx, .xls up to 50MB</p>

        <label className="inline-flex items-center gap-2 cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors">
          <span>Browse Dataset</span>
          <input type="file" className="sr-only" accept=".csv, .xlsx, .xls" onChange={handleChange} />
        </label>
      </div>

      {uploading && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-teal-900 text-xs font-medium">
          <LoadingSpinner size="xs" color="sky" />
          <span>Uploading dataset and preparing secure container environment...</span>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
