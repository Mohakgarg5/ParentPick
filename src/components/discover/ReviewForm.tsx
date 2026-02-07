"use client";

import { useState } from "react";
import { HELPFUL_TAGS } from "@/lib/constants";

interface ReviewFormProps {
  videoId: number;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ videoId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/videos/${videoId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, helpfulTags: selectedTags }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      setRating(0);
      setComment("");
      setSelectedTags([]);
      onReviewSubmitted();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-100">
      <h3 className="font-semibold text-slate-800 mb-4">Leave a Review</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <div className="mb-4">
        <label className="block text-sm text-slate-600 mb-2">Your Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className={`text-3xl transition-colors ${
                star <= (hoverRating || rating) ? "text-amber-400" : "text-slate-200"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-600 mb-2">Your Experience</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          placeholder="How was this content for your child? Any observations?"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-600 mb-2">Helpful Tags</label>
        <div className="flex flex-wrap gap-2">
          {HELPFUL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
