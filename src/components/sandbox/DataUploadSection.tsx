"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";

export function DataUploadSection({ paperId }: { paperId: number }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

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
    setMessage("");
    
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

      setMessage("File uploaded successfully. AI Analysis will begin shortly.");
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-2">Upload Data Files</h3>
      <div 
        className={`border-2 border-dashed p-10 text-center rounded-lg transition-colors ${
          isDragging ? "border-sky-500 bg-sky-50" : "border-gray-300 bg-gray-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          Drag and drop your CSV or Excel files here, or click to select
        </p>
        <label className="cursor-pointer bg-sky-500 text-white px-4 py-2 rounded shadow hover:bg-sky-600 transition">
          Browse Files
          <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleChange} />
        </label>
      </div>
      {uploading && <p className="mt-2 text-sky-500">Uploading...</p>}
      {message && <p className="mt-2 text-sm font-medium text-gray-800">{message}</p>}
    </div>
  );
}
