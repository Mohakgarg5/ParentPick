"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CONCERNS, SITUATIONS, CONTENT_PREFERENCES } from "@/lib/constants";

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

interface ChildEntry {
  name: string;
  dateOfBirth: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editing, setEditing] = useState<string | null>(null); // "name" | "children" | "preferences" | null
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editChildren, setEditChildren] = useState<ChildEntry[]>([]);
  const [editConcerns, setEditConcerns] = useState<string[]>([]);
  const [editSituations, setEditSituations] = useState<string[]>([]);
  const [editContentPrefs, setEditContentPrefs] = useState<string[]>([]);

  const fetchProfile = () => {
    fetch("/api/profile")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          if (r.status === 401 || r.status === 404) {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
            return null;
          }
          throw new Error(data.error || "Failed to load profile");
        }
        return data;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
        else if (data) setError("Could not load profile data");
      })
      .catch((e) => setError(e.message || "Something went wrong"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const startEdit = (section: string) => {
    if (!user) return;
    if (section === "name") {
      setEditName(user.name);
    } else if (section === "children") {
      setEditChildren(
        user.children.length > 0
          ? user.children.map((c) => ({ name: c.name, dateOfBirth: c.dateOfBirth.split("T")[0] }))
          : [{ name: "", dateOfBirth: "" }]
      );
    } else if (section === "preferences") {
      setEditConcerns(user.preferences ? JSON.parse(user.preferences.concerns) : []);
      setEditSituations(user.preferences ? JSON.parse(user.preferences.situations) : []);
      setEditContentPrefs(user.preferences ? JSON.parse(user.preferences.contentPrefs) : []);
    }
    setEditing(section);
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (editing === "name") body.name = editName;
      if (editing === "children") body.children = editChildren;
      if (editing === "preferences") {
        body.concerns = editConcerns;
        body.situations = editSituations;
        body.contentPrefs = editContentPrefs;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");

      setEditing(null);
      setLoading(true);
      fetchProfile();
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const today = new Date().toISOString().split("T")[0];
  const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split("T")[0];

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Your Profile</h1>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Sign Out
        </button>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-2xl font-bold">
              {user.name[0]}
            </div>
            {editing === "name" ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-bold text-slate-800 border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            ) : (
              <div>
                <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                <p className="text-slate-500">{user.email}</p>
              </div>
            )}
          </div>
          {editing === "name" ? (
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button onClick={() => startEdit("name")} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Edit</button>
          )}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {hasChildren ? "Your Children" : "Child Information"}
          </h3>
          {editing === "children" ? (
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button onClick={() => startEdit("children")} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Edit</button>
          )}
        </div>

        {editing === "children" ? (
          <div className="space-y-3">
            {editChildren.map((child, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Child {index + 1}</span>
                  {editChildren.length > 1 && (
                    <button
                      onClick={() => setEditChildren((prev) => prev.filter((_, i) => i !== index))}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) => setEditChildren((prev) => prev.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)))}
                  placeholder="Name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="date"
                  value={child.dateOfBirth}
                  onChange={(e) => setEditChildren((prev) => prev.map((c, i) => (i === index ? { ...c, dateOfBirth: e.target.value } : c)))}
                  min={minDate}
                  max={today}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
            <button
              onClick={() => setEditChildren((prev) => [...prev, { name: "", dateOfBirth: "" }])}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-teal-300 hover:text-teal-600"
            >
              + Add Another Child
            </button>
          </div>
        ) : hasChildren ? (
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
          <p className="text-slate-500 text-sm">No children added yet</p>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Your Preferences</h3>
          {editing === "preferences" ? (
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button onClick={() => startEdit("preferences")} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Edit</button>
          )}
        </div>

        {editing === "preferences" ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Concerns</p>
              <div className="flex flex-wrap gap-2">
                {CONCERNS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleItem(editConcerns, setEditConcerns, c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      editConcerns.includes(c)
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {editConcerns.includes(c) ? "✓ " : ""}{c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Typical Situations</p>
              <div className="flex flex-wrap gap-2">
                {SITUATIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleItem(editSituations, setEditSituations, s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      editSituations.includes(s)
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {editSituations.includes(s) ? "✓ " : ""}{s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Content Preferences</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_PREFERENCES.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleItem(editContentPrefs, setEditContentPrefs, p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      editContentPrefs.includes(p)
                        ? "bg-teal-50 text-teal-600 border-teal-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {editContentPrefs.includes(p) ? "✓ " : ""}{p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {concerns.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-600 mb-2">Concerns</p>
                <div className="flex flex-wrap gap-2">
                  {concerns.map((c) => (
                    <span key={c} className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-600">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {situations.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-600 mb-2">Typical Situations</p>
                <div className="flex flex-wrap gap-2">
                  {situations.map((s) => (
                    <span key={s} className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-600">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {contentPrefs.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Content Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {contentPrefs.map((p) => (
                    <span key={p} className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-600">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {concerns.length === 0 && situations.length === 0 && contentPrefs.length === 0 && (
              <p className="text-slate-500 text-sm">No preferences set yet</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
