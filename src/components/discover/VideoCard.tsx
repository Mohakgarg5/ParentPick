"use client";

import Link from "next/link";
import { AGE_GROUPS, STIMULATION_LABELS } from "@/lib/constants";

interface VideoCardProps {
  id: number;
  youtubeId: string;
  title: string;
  channelName: string;
  ageMin: number;
  ageMax: number;
  category: string;
  tags: string;
  parentRating: number;
  reviewCount: number;
  stimulationLevel?: number | null;
}

export default function VideoCard({
  id,
  youtubeId,
  title,
  channelName,
  ageMin,
  ageMax,
  category,
  tags,
  parentRating,
  reviewCount,
  stimulationLevel,
}: VideoCardProps) {
  const parsedTags: string[] = JSON.parse(tags);
  const ageGroup = AGE_GROUPS.find(
    (g) => g.ageMin === ageMin && g.ageMax === ageMax
  ) || AGE_GROUPS.find((g) => g.ageMin <= ageMin && g.ageMax >= ageMax);

  const stimLabel = stimulationLevel
    ? STIMULATION_LABELS.find((s) => s.level === Math.round(stimulationLevel))
    : null;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? "text-amber-400" : "text-slate-200"}>
        ★
      </span>
    ));
  };

  return (
    <Link href={`/discover/video/${id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer border border-slate-100">
        <div className="relative">
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
            alt={title}
            className="w-full h-44 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            {stimLabel && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${stimLabel.color}`}>
                {stimLabel.label}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${ageGroup?.color || "bg-slate-100 text-slate-600"}`}>
              {ageGroup?.icon} {ageMin}-{ageMax}y
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{channelName}</p>

          <div className="flex items-center gap-1 mt-2">
            <div className="flex text-sm">{renderStars(parentRating)}</div>
            <span className="text-xs text-slate-500">({reviewCount})</span>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
              {category}
            </span>
            {parsedTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
