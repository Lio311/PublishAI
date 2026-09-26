"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Intercepts any future window.alert() calls and redirects them to the Sonner toast system.
 */
export default function AlertOverride() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;
      window.alert = (message?: any) => {
        toast(message?.toString() || "Alert");
      };
      return () => {
        window.alert = originalAlert;
      };
    }
  }, []);

  return null;
}
