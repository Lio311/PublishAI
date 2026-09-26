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
      window.alert = (message?: unknown) => {
        let displayMessage = "Alert";
        if (typeof message === "string") {
          displayMessage = message;
        } else if (message instanceof Error) {
          displayMessage = message.message;
        } else if (typeof message === "object" && message !== null) {
          try {
            displayMessage = JSON.stringify(message);
          } catch {
            displayMessage = String(message);
          }
        } else if (message !== undefined && message !== null) {
          displayMessage = String(message);
        }
        toast(displayMessage);
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, []);

  return null;
}
