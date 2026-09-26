"use client";

import { UploadCloud, Loader2, CheckCircle } from "lucide-react";
import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "@/app/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const t = useTranslations("Dashboard.upload");

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleUpload = async (files: FileList | File[]) => {
    if (isUploading || uploadSuccess) return;
    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const manuscriptFiles = fileArray.filter(f => !f.name.endsWith('.csv') && !f.name.endsWith('.xlsx'));
      const datasetFiles = fileArray.filter(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx'));

      if (datasetFiles.length > 0) {
        const analyzeData = new FormData();
        analyzeData.append("dataset", datasetFiles[0]);
        try {
          const analyzeRes = await fetch("/api/data/analyze", { method: "POST", body: analyzeData });
          if (analyzeRes.ok) {
            const result = await analyzeRes.json();
            if (typeof window !== "undefined") {
              sessionStorage.setItem("pendingDataSchema", JSON.stringify(result.columns));
            }
          }
        } catch (e) {
          console.error("Failed to analyze dataset:", e);
        }
      }

      const formData = new FormData();
      const filesToUpload = manuscriptFiles.length > 0 ? manuscriptFiles : fileArray;
      filesToUpload.forEach((file) => {
        formData.append("file", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Upload failed");
      }

      const data = await res.json();
      console.log("Success:", data);
      
      const paperId = data.papers?.[0]?.paper?.id;
      if (!paperId) {
        throw new Error("No paper was generated from upload");
      }

      setUploadSuccess(true);
      
      // Navigate to the paper details page after 1.5 seconds
      timeoutRef.current = setTimeout(() => {
        router.push(`/papers/${paperId}`); 
      }, 1500);

    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error?.message || t('error_uploading') || "שגיאה בהעלאת הקובץ. אנא נסה שוב.");
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, []);

  const handleClickZone = (e: React.MouseEvent) => {
    if (isUploading || uploadSuccess) return;
    if (fileInputRef.current && e.target !== fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isUploading || uploadSuccess) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={isUploading || uploadSuccess ? -1 : 0}
      aria-label={t("dragTitle")}
      onClick={handleClickZone}
      onKeyDown={handleKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 cursor-pointer
        ${isDragging ? "border-sky-500 bg-sky-50/50" : "border-slate-300/50 bg-white/40 backdrop-blur-xl hover:bg-white/60 hover:border-blue-400/50 shadow-[0_8px_32px_rgba(0,0,0,0.02)]"}
        ${isUploading ? "opacity-75 cursor-not-allowed" : ""}
      `}
    >
      <div 
        className={`p-4 rounded-full mb-4 ${uploadSuccess ? 'bg-green-100' : 'bg-sky-100'}`}
        role="status"
        aria-live="polite"
      >
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" aria-label={t("uploading")} />
        ) : uploadSuccess ? (
          <CheckCircle className="w-8 h-8 text-green-600" aria-label={t("success")} />
        ) : (
          <UploadCloud className="w-8 h-8 text-sky-500" aria-hidden="true" />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {isUploading ? t("processing") : uploadSuccess ? t("success") : t("dragTitle")}
      </h3>
      
      {!isUploading && !uploadSuccess && (
        <p className="text-slate-500 mb-6 max-w-md">
          {t("description")}
        </p>
      )}
      
      <div className="relative mt-2">
        <input 
          ref={fileInputRef}
          type="file" 
          multiple
          accept=".pdf,.docx,.csv,.xlsx,.png,.jpg,.jpeg,.pptx"
          aria-label={t("button")}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
          disabled={isUploading || uploadSuccess}
          onChange={(e) => {
            if (e.target.files?.length) {
              handleUpload(e.target.files);
              e.target.value = "";
            }
          }}
        />
        <button 
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          disabled={isUploading || uploadSuccess}
          className="bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 pointer-events-none"
        >
          {isUploading ? t("uploading") : t("button")}
        </button>
      </div>
    </div>
  );
}
