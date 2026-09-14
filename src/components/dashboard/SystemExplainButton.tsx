"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SystemFlowModal from "./SystemFlowModal";

export default function SystemExplainButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations("SystemFlow");

  return (
    <>
      <motion.button
        onClick={() => setIsModalOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative inline-flex items-center gap-3 px-7 py-4 
          bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300
          hover:from-blue-500 hover:via-sky-500 hover:to-sky-400
          text-white font-bold text-base rounded-2xl 
          shadow-[0_8px_30px_rgba(56,189,248,0.25)]
          hover:shadow-[0_12px_40px_rgba(56,189,248,0.35)]
          transition-all duration-300 ease-out
          hover:-translate-y-0.5 active:translate-y-0
          overflow-hidden"
      >
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
          translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
        
        {/* Icon */}
        <div className="relative">
          <Info className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
        </div>

        <span className="relative">{t("button")}</span>

        {/* Animated arrow */}
        <svg 
          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </motion.button>

      <SystemFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
