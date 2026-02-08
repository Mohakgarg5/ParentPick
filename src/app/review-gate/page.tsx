"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGE_GROUPS } from "@/lib/constants";

interface Video {
  id: number;
  youtubeId: string;
  title: string;
  channelName: string;
  ageMin: number;
  ageMax: number;
  category: string;
  parentRating: number;
  reviewCount: number;
}

export default function ReviewGatePage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews/pending")
      .then((res) => res.json())
      .then((data) => {
        if (!data.needsReviews) {
          router.replace("/discover");
          return;
        }
        setReviewCount(data.reviewCount);
        setVideos(data.unreviewedVideos || []);
      })
      .catch(() => router.replace("/discover"))
      .finally(() => setLoading(false));
  }, [router]);

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
      <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center mb-8">
        <div className="text-4xl mb-4">&#9997;&#65039;</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Help the community!
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          You&apos;ve reviewed <strong>{reviewCount} of 3</strong> videos. Review a few more to help
          other parents find great content for their kids.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                n <= reviewCount
                  ? "bg-teal-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {n <= reviewCount ? "✓" : n}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Pick a video to review</h2>
        <Link
          href="/discover"
          className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          Skip for now →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((video) => {
          const ageGroup = AGE_GROUPS.find(
            (g) => g.ageMin <= video.ageMin && g.ageMax >= video.ageMax
          );

          return (
            <Link key={video.id} href={`/discover/video/${video.id}`}>
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
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
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
