"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  childName: string | null;
  childAge: number | null;
  preferences: {
    concerns: string;
    situations: string;
    contentPrefs: string;
  } | null;
  groupMemberships: { group: { id: number; name: string; icon: string } }[];
  _count: { reviews: number; posts: number; comments: number };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setChildName(data.user.childName || "");
          setChildAge(data.user.childAge?.toString() || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, childAge }),
      });
      if (res.ok) {
        setEditing(false);
        setUser((prev) =>
          prev
            ? { ...prev, childName, childAge: parseInt(childAge) }
            : prev
        );
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!user) return null;

  const concerns: string[] = user.preferences ? JSON.parse(user.preferences.concerns) : [];
  const situations: string[] = user.preferences ? JSON.parse(user.preferences.situations) : [];
  const contentPrefs: string[] = user.preferences ? JSON.parse(user.preferences.contentPrefs) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Your Profile</h1>

      {/* User Info */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-2xl font-bold">
            {user.name[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-teal-600">{user._count.reviews}</p>
            <p className="text-xs text-slate-500">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-teal-600">{user._count.posts}</p>
            <p className="text-xs text-slate-500">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-teal-600">{user._count.comments}</p>
            <p className="text-xs text-slate-500">Comments</p>
          </div>
        </div>
      </div>

      {/* Child Info */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Child Information</h3>
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className="text-sm text-teal-600 font-medium hover:underline"
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Name</label>
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Age</label>
              <select
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {[1, 2, 3, 4, 5, 6].map((a) => (
                  <option key={a} value={a}>{a} years old</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-600">
              <span className="font-medium">Name:</span> {user.childName || "Not set"}
            </p>
            <p className="text-slate-600">
              <span className="font-medium">Age:</span>{" "}
              {user.childAge ? `${user.childAge} years old` : "Not set"}
            </p>
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Groups</h3>
        {user.groupMemberships.length === 0 ? (
          <p className="text-slate-500 text-sm">Not a member of any groups yet</p>
        ) : (
          <div className="space-y-2">
            {user.groupMemberships.map((m) => (
              <div key={m.group.id} className="flex items-center gap-2 text-slate-600">
                <span>{m.group.icon}</span>
                <span>{m.group.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl p-6 border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Preferences</h3>

        {concerns.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Concerns</p>
            <div className="flex flex-wrap gap-2">
              {concerns.map((c) => (
                <span key={c} className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-600">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {situations.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Typical Situations</p>
            <div className="flex flex-wrap gap-2">
              {situations.map((s) => (
                <span key={s} className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-600">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {contentPrefs.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">Content Preferences</p>
            <div className="flex flex-wrap gap-2">
              {contentPrefs.map((p) => (
                <span key={p} className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-600">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
