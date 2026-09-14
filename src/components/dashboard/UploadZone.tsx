"use client";

import { UploadCloud, Loader2, CheckCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations("Dashboard.upload");

  const handleUpload = async (files: FileList | File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("file", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      console.log("Success:", data);
      
      setUploadSuccess(true);
      
      // Navigate to the paper details page after 1.5 seconds
      setTimeout(() => {
        router.push(`/papers/${data.papers[0]?.paper?.id}`); 
      }, 1500);

    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t('error_uploading') || "שגיאה בהעלאת הקובץ. אנא נסה שוב.");
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

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors duration-200 ease-in-out cursor-pointer
        ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-slate-400"}
        ${isUploading ? "opacity-75 cursor-not-allowed" : ""}
      `}
    >
      <div className={`p-4 rounded-full mb-4 ${uploadSuccess ? 'bg-green-100' : 'bg-blue-100'}`}>
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        ) : uploadSuccess ? (
          <CheckCircle className="w-8 h-8 text-green-600" />
        ) : (
          <UploadCloud className="w-8 h-8 text-blue-600" />
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
          type="file" 
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
          disabled={isUploading || uploadSuccess}
          onChange={(e) => {
            if (e.target.files?.length) {
              handleUpload(e.target.files);
            }
          }}
        />
        <button 
          disabled={isUploading || uploadSuccess}
          className="bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 hover:from-blue-800 hover:via-blue-600 hover:to-sky-300 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isUploading ? t("uploading") : t("button")}
        </button>
      </div>
    </div>
  );
}
