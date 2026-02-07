"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import ReviewForm from "@/components/discover/ReviewForm";
import { AGE_GROUPS } from "@/lib/constants";

interface Review {
  id: number;
  rating: number;
  comment: string;
  helpfulTags: string;
  createdAt: string;
  user: { id: number; name: string };
}

interface Video {
  id: number;
  youtubeId: string;
  title: string;
  description: string;
  channelName: string;
  ageMin: number;
  ageMax: number;
  category: string;
  tags: string;
  parentRating: number;
  reviewCount: number;
  reviews: Review[];
}

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVideo = () => {
    fetch(`/api/videos/${id}`)
      .then((res) => res.json())
      .then((data) => setVideo(data.video))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Video not found</p>
      </div>
    );
  }

  const parsedTags: string[] = JSON.parse(video.tags);
  const ageGroup = AGE_GROUPS.find(
    (g) => g.ageMin <= video.ageMin && g.ageMax >= video.ageMax
  );

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? "text-amber-400" : "text-slate-200"}>
        ★
      </span>
    ));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/discover" className="text-teal-600 hover:underline text-sm mb-4 inline-block">
        &larr; Back to Discover
      </Link>

      {/* YouTube Embed */}
      <div className="relative w-full pt-[56.25%] bg-black rounded-xl overflow-hidden mb-6">
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${video.youtubeId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Video Info */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{video.title}</h1>
        <p className="text-slate-500 mt-1">{video.channelName}</p>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <div className="flex text-lg">{renderStars(video.parentRating)}</div>
            <span className="text-sm text-slate-500">
              {video.parentRating.toFixed(1)} ({video.reviewCount} reviews)
            </span>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${ageGroup?.color || "bg-slate-100"}`}>
            {ageGroup?.icon} Ages {video.ageMin}-{video.ageMax}
          </span>
        </div>

        <p className="text-slate-600 mt-4">{video.description}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm px-3 py-1 rounded-full bg-teal-50 text-teal-700 font-medium">
            {video.category}
          </span>
          {parsedTags.map((tag) => (
            <span key={tag} className="text-sm px-3 py-1 rounded-full bg-amber-50 text-amber-700">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Review Form */}
      <div className="mb-6">
        <ReviewForm videoId={video.id} onReviewSubmitted={fetchVideo} />
      </div>

      {/* Reviews List */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Parent Reviews ({video.reviews.length})
        </h2>
        {video.reviews.length === 0 ? (
          <p className="text-slate-500 bg-white rounded-xl p-6 border border-slate-100">
            No reviews yet. Be the first to share your experience!
          </p>
        ) : (
          <div className="space-y-4">
            {video.reviews.map((review) => {
              const reviewTags: string[] = JSON.parse(review.helpfulTags);
              return (
                <div key={review.id} className="bg-white rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-semibold text-sm">
                        {review.user.name[0]}
                      </div>
                      <span className="font-medium text-slate-800">{review.user.name}</span>
                    </div>
                    <div className="flex text-sm">{renderStars(review.rating)}</div>
                  </div>
                  {review.comment && (
                    <p className="text-slate-600 mt-3">{review.comment}</p>
                  )}
                  {reviewTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {reviewTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
