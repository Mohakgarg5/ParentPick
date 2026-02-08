"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ICONS = ["👶", "🐣", "🧸", "📚", "🎨", "🎒", "🌟", "🎵", "🏃", "🧩", "🌈", "🎮"];

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ageMin, setAgeMin] = useState("1");
  const [ageMax, setAgeMax] = useState("6");
  const [icon, setIcon] = useState("👶");
  const [firstPostTitle, setFirstPostTitle] = useState("");
  const [firstPostContent, setFirstPostContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "first-post">("details");
  const [groupId, setGroupId] = useState<number | null>(null);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, ageMin, ageMax, icon }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setGroupId(data.group.id);
      setStep("first-post");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleFirstPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: firstPostTitle, content: firstPostContent }),
      });

      if (res.ok) {
        router.push(`/groups/${groupId}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create post");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/groups" className="text-teal-600 hover:underline text-sm mb-4 inline-block">
        &larr; Back to Groups
      </Link>

      {step === "details" ? (
        <>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Create a Community</h1>
          <p className="text-slate-600 mb-6">
            Start a new space for parents to connect and share.
          </p>

          <form onSubmit={handleCreateGroup} className="bg-white rounded-xl p-6 border border-slate-100 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Community Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      icon === ic
                        ? "bg-teal-100 ring-2 ring-teal-500"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Community Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Outdoor Adventures for Toddlers"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about? Who is it for?"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age Min</label>
                <select
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age Max</label>
                <select
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Community"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Post Your First Thread</h1>
          <p className="text-slate-600 mb-6">
            Kick off the conversation in your new community!
          </p>

          <form onSubmit={handleFirstPost} className="bg-white rounded-xl p-6 border border-slate-100 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Post Title</label>
              <input
                type="text"
                value={firstPostTitle}
                onChange={(e) => setFirstPostTitle(e.target.value)}
                placeholder="Welcome to the community! Let's introduce ourselves."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <textarea
                value={firstPostContent}
                onChange={(e) => setFirstPostContent(e.target.value)}
                placeholder="Share something to get the discussion started..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Posting..." : "Post & View Community"}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/groups/${groupId}`)}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium"
              >
                Skip
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
