"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "sky" | "blue" | "white" | "slate" | "indigo" | "emerald";
  label?: string;
  sublabel?: string;
  fullContainer?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const colorMap = {
  sky: "text-sky-500",
  blue: "text-blue-600",
  white: "text-white",
  slate: "text-slate-500",
  indigo: "text-indigo-600",
  emerald: "text-emerald-500",
};

export default function LoadingSpinner({
  size = "md",
  color = "sky",
  label,
  sublabel,
  fullContainer = false,
  className = "",
}: LoadingSpinnerProps) {
  const spinnerContent = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Subtle glowing background pulse */}
        <span
          className={`absolute rounded-full animate-ping opacity-20 ${colorMap[color]} bg-current ${
            size === "xl" ? "w-10 h-10" : size === "lg" ? "w-7 h-7" : "w-5 h-5"
          }`}
        />
        <Loader2 className={`animate-spin ${sizeMap[size]} ${colorMap[color]} relative z-10`} />
      </div>

      {label && (
        <span className="text-sm font-semibold text-slate-700 tracking-wide select-none animate-pulse">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-xs text-slate-500 max-w-xs text-center leading-relaxed select-none">
          {sublabel}
        </span>
      )}
    </div>
  );

  if (fullContainer) {
    return (
      <div className="w-full h-full min-h-[160px] flex items-center justify-center p-8 bg-white/40 backdrop-blur-xs rounded-2xl">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}
