"use client";

import { useState } from "react";

interface CaptchaSolverProps {
  submissionId: string | number;
}

export function CaptchaSolver({ submissionId }: CaptchaSolverProps) {
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solution.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/captcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: typeof submissionId === "string" ? parseInt(submissionId, 10) || submissionId : submissionId,
          solution: solution.trim(),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Fallback for non-JSON responses
      }

      if (res.ok) {
        setSolved(true);
      } else {
        setError(data?.error || `Failed to submit captcha (${res.status})`);
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
      console.error("Captcha submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (solved) {
    return (
      <div role="status" aria-live="polite" className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
        Captcha submitted successfully!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm" noValidate>
      <div>
        <label htmlFor="captcha-input" className="block text-sm font-medium text-gray-700">
          Captcha Solution
        </label>
        <input
          id="captcha-input"
          type="text"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          aria-describedby={error ? "captcha-error" : undefined}
          aria-invalid={Boolean(error)}
          aria-required="true"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border outline-none"
          placeholder="Enter captcha text..."
          required
        />
      </div>
      {error && (
        <p id="captcha-error" role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !solution.trim()}
        aria-busy={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Submitting..." : "Submit Captcha"}
      </button>
    </form>
  );
}
