"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AGE_GROUPS, CATEGORIES } from "@/lib/constants";

interface ReviewWithVideo {
  id: number;
  rating: number;
  comment: string;
  helpfulTags: string;
  overallRating: number | null;
  createdAt: string;
  user: { id: number; name: string };
  video: {
    id: number;
    title: string;
    youtubeId: string;
    channelName: string;
    ageMin: number;
    ageMax: number;
    category: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedCategory
    ? reviews.filter((r) => r.video.category === selectedCategory)
    : reviews;

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Content Reviews</h1>
          <p className="text-slate-600 mt-1">
            See what other parents are saying about kids content
          </p>
        </div>
        <Link
          href="/reviews/write"
          className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
        >
          Write a Review
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            !selectedCategory
              ? "bg-teal-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedCategory === cat
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <p className="text-slate-500">No reviews yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => {
            const tags: string[] = JSON.parse(review.helpfulTags);
            const ageGroup = AGE_GROUPS.find(
              (g) => g.ageMin <= review.video.ageMin && g.ageMax >= review.video.ageMax
            );
            const displayRating = review.overallRating ?? review.rating;

            return (
              <div key={review.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="flex">
                  {/* Video thumbnail */}
                  <Link href={`/discover/video/${review.video.id}`} className="flex-shrink-0">
                    <img
                      src={`https://img.youtube.com/vi/${review.video.youtubeId}/mqdefault.jpg`}
                      alt={review.video.title}
                      className="w-40 h-full object-cover"
                    />
                  </Link>

                  {/* Review content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/discover/video/${review.video.id}`}
                          className="font-semibold text-slate-800 hover:text-teal-600 transition-colors"
                        >
                          {review.video.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{review.video.channelName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ageGroup?.color || "bg-slate-100"}`}>
                            Ages {review.video.ageMin}-{review.video.ageMax}
                          </span>
                        </div>
                      </div>
                      <div className="flex text-sm">{renderStars(displayRating)}</div>
                    </div>

                    <p className="text-slate-600 mt-2 text-sm">{review.comment}</p>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span>by {review.user.name}</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      <Link
                        href={`/discover/video/${review.video.id}`}
                        className="text-teal-600 hover:underline"
                      >
                        Watch Video →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
