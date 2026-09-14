import React from "react";

type VerificationStatus = "verified" | "discrepancy" | "unclear";

interface ClaimVerificationBadgeProps {
  status: VerificationStatus | string;
}

export default function ClaimVerificationBadge({ status }: ClaimVerificationBadgeProps) {
  const getBadgeStyles = () => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 border-green-200";
      case "discrepancy":
        return "bg-red-100 text-red-800 border-red-200";
      case "unclear":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "verified": return "Verified";
      case "discrepancy": return "Discrepancy";
      case "unclear": default: return "Unclear";
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyles()}`}>
      {getLabel()}
    </span>
  );
}
