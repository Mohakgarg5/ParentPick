"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGE_GROUPS, FEEDBACK_CRITERIA, HELPFUL_TAGS, CONTENT_QUALITY_TAGS } from "@/lib/constants";

interface Video {
  id: number;
  youtubeId: string;
  title: string;
  channelName: string;
  ageMin: number;
  ageMax: number;
  category: string;
  parentRating: number;
}

export default function WriteReviewPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [step, setStep] = useState<"select" | "rate" | "detail">("select");
  const [search, setSearch] = useState("");

  // Rating state
  const [ratings, setRatings] = useState<Record<string, number>>({
    educationalRating: 0,
    ageAppropriateRating: 0,
    engagementRating: 0,
    stimulationRating: 0,
    overallRating: 0,
  });
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContentTags, setSelectedContentTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => setVideos(data.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredVideos = search
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(search.toLowerCase()) ||
          v.channelName.toLowerCase().includes(search.toLowerCase())
      )
    : videos;

  const allRated = Object.values(ratings).every((r) => r > 0);

  const handleSubmitFeedback = async () => {
    if (!selectedVideo || !allRated) return;
    setSubmitting(true);
    setError("");

    try {
      // Submit the mandatory feedback
      const feedbackRes = await fetch(`/api/videos/${selectedVideo.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ratings, contentTags: selectedContentTags }),
      });

      if (!feedbackRes.ok) {
        const data = await feedbackRes.json();
        setError(data.error || "Failed to submit rating");
        return;
      }

      // If user wrote a comment or selected tags, submit the detailed review too
      if (comment.trim() || selectedTags.length > 0) {
        await fetch(`/api/videos/${selectedVideo.id}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: ratings.overallRating,
            comment: comment.trim(),
            helpfulTags: selectedTags,
          }),
        });
      }

      setStep("detail");
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? "text-amber-400" : "text-slate-200"}>
        ★
      </span>
    ));

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  // Step 3: Success
  if (step === "detail") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-100">
          <div className="text-5xl mb-4">&#127881;</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Review Submitted!</h1>
          <p className="text-slate-600 mb-6">
            Thanks for helping other parents find great content for their kids.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSelectedVideo(null);
                setStep("select");
                setRatings({ educationalRating: 0, ageAppropriateRating: 0, engagementRating: 0, stimulationRating: 0, overallRating: 0 });
                setComment("");
                setSelectedTags([]);
              }}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Review Another
            </button>
            <Link
              href="/reviews"
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              View All Reviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Rate the video
  if (step === "rate" && selectedVideo) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => { setStep("select"); setSelectedVideo(null); }}
          className="text-teal-600 hover:underline text-sm mb-4 inline-block"
        >
          &larr; Pick a different video
        </button>

        {/* Selected video preview */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-6">
          <div className="flex items-center gap-4 p-4">
            <img
              src={`https://img.youtube.com/vi/${selectedVideo.youtubeId}/mqdefault.jpg`}
              alt={selectedVideo.title}
              className="w-28 h-20 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-slate-800">{selectedVideo.title}</h3>
              <p className="text-sm text-slate-500">{selectedVideo.channelName}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Rate This Video</h2>
          <p className="text-sm text-slate-500 mb-6">Rate across 5 criteria</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <div className="space-y-5 mb-6">
            {FEEDBACK_CRITERIA.map((criterion) => (
              <div key={criterion.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700 text-sm">{criterion.label}</span>
                  <span className="text-xs text-slate-400">{criterion.description}</span>
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
                        onClick={() => setRatings((prev) => ({ ...prev, [criterion.key]: starValue }))}
                        onMouseEnter={() => setHoverRatings((prev) => ({ ...prev, [criterion.key]: starValue }))}
                        onMouseLeave={() => setHoverRatings((prev) => ({ ...prev, [criterion.key]: 0 }))}
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

          {/* Optional detailed review */}
          <div className="border-t border-slate-100 pt-5 mt-5">
            <h3 className="font-medium text-slate-700 mb-3">Optional: Add more detail</h3>

            <div className="mb-4">
              <label className="block text-sm text-slate-600 mb-2">Your Experience</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="How was this content for your child?"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-600 mb-2">Helpful Tags</label>
              <div className="flex flex-wrap gap-2">
                {HELPFUL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
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

            <div className="mb-4">
              <label className="block text-sm text-slate-600 mb-2">Content Quality Tags</label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_QUALITY_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedContentTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedContentTags.includes(tag)
                        ? "bg-purple-500 text-white border-purple-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitFeedback}
            disabled={!allRated || submitting}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>

          {!allRated && (
            <p className="text-xs text-slate-400 text-center mt-2">
              Please rate all 5 criteria to submit
            </p>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Select a video
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/reviews" className="text-teal-600 hover:underline text-sm mb-4 inline-block">
        &larr; Back to Reviews
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">Write a Review</h1>
      <p className="text-slate-600 mb-6">Select the content you want to review</p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or channel..."
        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-6"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredVideos.map((video) => {
          const ageGroup = AGE_GROUPS.find(
            (g) => g.ageMin <= video.ageMin && g.ageMax >= video.ageMax
          );

          return (
            <button
              key={video.id}
              onClick={() => { setSelectedVideo(video); setStep("rate"); }}
              className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-teal-200 transition-all text-left"
            >
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">{video.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{video.channelName}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex text-sm">{renderStars(video.parentRating)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ageGroup?.color || "bg-slate-100"}`}>
                    {ageGroup?.icon} {video.ageMin}-{video.ageMax}y
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
