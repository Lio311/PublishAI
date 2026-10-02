"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage, errorName } from "@/services/utils/errors";

export interface Loadable<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs the loader, showing the loading state again. */
  reload: () => void;
}

/**
 * Runs an async loader on mount (and whenever the loader identity changes),
 * aborting the request on unmount. State is only updated from promise
 * callbacks, never synchronously inside the effect.
 *
 * `load` must be stable (wrap it in useCallback with its real dependencies).
 */
export function useLoadable<T>(load: (signal: AbortSignal) => Promise<T>): Loadable<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (value) => {
        setData(value);
        setError(null);
        setLoading(false);
      },
      (err: unknown) => {
        if (controller.signal.aborted || errorName(err) === "AbortError") return;
        setError(errorMessage(err) || "Request failed");
        setLoading(false);
      }
    );
    return () => controller.abort();
  }, [load, attempt]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, loading, error, reload };
}
