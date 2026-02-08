"use client";

import { useState } from "react";
import { FEEDBACK_CRITERIA } from "@/lib/constants";

interface FeedbackModalProps {
  videoId: number;
  videoTitle: string;
  isOpen: boolean;
  onClose?: () => void;
  onSubmitted: () => void;
}

export default function FeedbackModal({ videoId, videoTitle, isOpen, onClose, onSubmitted }: FeedbackModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    educationalRating: 0,
    ageAppropriateRating: 0,
    engagementRating: 0,
    overallRating: 0,
  });
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const allRated = Object.values(ratings).every((r) => r > 0);

  const handleSubmit = async () => {
    if (!allRated) {
      setError("Please rate all criteria before submitting");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/videos/${videoId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ratings),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }
      onSubmitted();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            &#10005;
          </button>
        )}
        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">
          How was this video?
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6 line-clamp-1">
          {videoTitle}
        </p>

        <div className="space-y-5">
          {FEEDBACK_CRITERIA.map((criterion) => (
            <div key={criterion.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-700 text-sm">
                  {criterion.label}
                </span>
                <span className="text-xs text-slate-400">
                  {criterion.description}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const starValue = i + 1;
                  const hover = hoverRatings[criterion.key] || 0;
                  const selected = ratings[criterion.key] || 0;
                  const filled = hover > 0 ? starValue <= hover : starValue <= selected;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setRatings((prev) => ({ ...prev, [criterion.key]: starValue }))
                      }
                      onMouseEnter={() =>
                        setHoverRatings((prev) => ({ ...prev, [criterion.key]: starValue }))
                      }
                      onMouseLeave={() =>
                        setHoverRatings((prev) => ({ ...prev, [criterion.key]: 0 }))
                      }
                      className={`text-2xl transition-colors cursor-pointer ${
                        filled ? "text-amber-400" : "text-slate-200"
                      } hover:scale-110`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mt-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!allRated || loading}
          className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>

        {!allRated && (
          <p className="text-xs text-slate-400 text-center mt-2">
            Please rate all 4 criteria to submit
          </p>
        )}
      </div>
    </div>
  );
}
