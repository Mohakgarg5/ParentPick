"use client";

import { useState, useEffect } from "react";
import VideoCard from "@/components/discover/VideoCard";
import { AGE_GROUPS, SITUATIONAL_TAGS, CATEGORIES } from "@/lib/constants";

const PREF_TO_CATEGORY: Record<string, string[]> = {
  "Educational & learning": ["Educational"],
  "Calming & slow-paced": ["Calming"],
  "Creative & artistic": ["Creative"],
  "Social skills & emotions": ["Social Skills"],
  "Music & songs": ["Language"],
  "Physical activity & dance": ["Motor Skills"],
  "Nature & animals": ["Educational"],
  "Stories & reading": ["Language"],
};

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
  thumbnailUrl: string;
  parentRating: number;
  reviewCount: number;
  stimulationLevel: number | null;
}

export default function DiscoverPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAge, setSelectedAge] = useState<{ min: number; max: number } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [childName, setChildName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.childAge) {
          setUserAge(data.user.childAge);
          setChildName(data.user.childName || null);
          const group = AGE_GROUPS.find(
            (g) => data.user.childAge >= g.ageMin && data.user.childAge <= g.ageMax
          );
          if (group) {
            setSelectedAge({ min: group.ageMin, max: group.ageMax });
          }
        }
        if (data.user?.preferences?.contentPrefs) {
          const prefs: string[] = JSON.parse(data.user.preferences.contentPrefs);
          const cats = prefs.flatMap((p) => PREF_TO_CATEGORY[p] || []);
          setPreferredCategories([...new Set(cats)]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAge) {
      params.set("ageMin", selectedAge.min.toString());
      params.set("ageMax", selectedAge.max.toString());
    }
    if (selectedCategory) {
      params.set("category", selectedCategory);
    }
    if (selectedTag) {
      params.set("tag", selectedTag);
    }

    setLoading(true);
    fetch(`/api/videos?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setVideos(data.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedAge, selectedTag, selectedCategory]);

  const recommendedVideos = preferredCategories.length > 0 && !selectedCategory && !selectedTag
    ? videos.filter((v) => preferredCategories.includes(v.category))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Discover</h1>
        <p className="text-slate-600 mt-1">
          Content recommended by real parents{childName ? ` for ${childName}` : userAge ? ` for your ${userAge}-year-old` : ""}
        </p>
      </div>

      {/* Age Group Tabs */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Age Group</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedAge(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedAge
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
            }`}
          >
            All Ages
          </button>
          {AGE_GROUPS.map((group) => (
            <button
              key={group.label}
              onClick={() =>
                setSelectedAge(
                  selectedAge?.min === group.ageMin ? null : { min: group.ageMin, max: group.ageMax }
                )
              }
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedAge?.min === group.ageMin
                  ? "bg-teal-600 text-white"
                  : `${group.color} hover:opacity-80`
              }`}
            >
              {group.icon} {group.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Category</h3>
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Situational Tags */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Situation</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !selectedTag
                ? "bg-amber-500 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-amber-300"
            }`}
          >
            All
          </button>
          {SITUATIONAL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedTag === tag
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended for You */}
      {!loading && recommendedVideos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Recommended for {childName || "You"}</h2>
          <p className="text-sm text-slate-500 mb-4">Based on your content preferences</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendedVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </div>
      )}

      {/* All Videos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-500 mt-4">Loading content...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No videos found for this filter</p>
          <p className="text-slate-400 mt-1">Try a different age group or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
      )}
    </div>
  );
}
