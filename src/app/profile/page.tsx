"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ChildInfo {
  id: number;
  name: string;
  dateOfBirth: string;
  age: number;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  childName: string | null;
  childAge: number | null;
  children: ChildInfo[];
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (r.status === 401 || r.status === 404) {
          window.location.href = "/login";
          return null;
        }
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
        else if (data) setError("Could not load profile data");
      })
      .catch((e) => setError(e.message || "Something went wrong"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-red-600 text-lg">{error}</p>
        <a href="/login" className="text-teal-600 hover:underline mt-2 inline-block">Go to Login</a>
      </div>
    );
  }

  if (!user) return null;

  const concerns: string[] = user.preferences ? JSON.parse(user.preferences.concerns) : [];
  const situations: string[] = user.preferences ? JSON.parse(user.preferences.situations) : [];
  const contentPrefs: string[] = user.preferences ? JSON.parse(user.preferences.contentPrefs) : [];

  const hasChildren = user.children && user.children.length > 0;

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

      {/* Children */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {hasChildren ? "Your Children" : "Child Information"}
        </h3>

        {hasChildren ? (
          <div className="space-y-3">
            {user.children.map((child) => (
              <div key={child.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {child.name[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{child.name}</p>
                  <p className="text-xs text-slate-500">
                    {child.age === 0 ? "Under 1 year" : `${child.age} year${child.age !== 1 ? "s" : ""} old`}
                    {" · Born "}
                    {new Date(child.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
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
              <Link key={m.group.id} href={`/groups/${m.group.id}`} className="flex items-center gap-2 text-slate-600 hover:text-teal-600">
                <span>{m.group.icon}</span>
                <span>{m.group.name}</span>
              </Link>
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
