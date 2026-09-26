"use client";

import { useState } from "react";

interface CaptchaSolverProps {
  submissionId: string;
}

export function CaptchaSolver({ submissionId }: CaptchaSolverProps) {
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/captcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, solution }),
      });
      if (res.ok) {
        setSolved(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit captcha");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (solved) {
    return (
      <div className="p-4 bg-green-50 text-green-700 rounded-md">
        Captcha submitted successfully!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label htmlFor="captcha" className="block text-sm font-medium text-gray-700">
          Captcha Solution
        </label>
        <input
          id="captcha"
          type="text"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="Enter captcha text..."
          required
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !solution.trim()}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Captcha"}
      </button>
    </form>
  );
}
