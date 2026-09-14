"use client";

import { UploadCloud } from "lucide-react";
import { useCallback, useState } from "react";

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);

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
      const file = e.dataTransfer.files[0];
      console.log("File dropped:", file.name);
      // TODO: Handle upload to server/blob storage
    }
  }, []);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors duration-200 ease-in-out cursor-pointer
        ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
    >
      <div className="bg-blue-100 p-4 rounded-full mb-4">
        <UploadCloud className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        גרור את המאמר שלך לכאן
      </h3>
      <p className="text-slate-500 mb-6 max-w-md">
        תומך בקבצי Word (.docx) או PDF. אנחנו ננתח את המסמך ונתחיל את תהליך הריוויזיה האוטומטי.
      </p>
      
      <div className="relative">
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept=".docx,.pdf"
          onChange={(e) => {
            if (e.target.files?.length) {
              console.log("File selected:", e.target.files[0].name);
            }
          }}
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors pointer-events-none">
          או בחר קובץ
        </button>
      </div>
    </div>
  );
}
