"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AGE_GROUPS } from "@/lib/constants";

interface Group {
  id: number;
  name: string;
  slug: string;
  description: string;
  ageMin: number;
  ageMax: number;
  memberCount: number;
  icon: string;
  _count: { posts: number };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/groups").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([groupsData, userData]) => {
        setGroups(groupsData.groups || []);
        if (userData.user?.groupMemberships) {
          setUserGroups(
            userData.user.groupMemberships.map((m: { group: { id: number } }) => m.group.id)
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (groupId: number) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
      const data = await res.json();
      if (data.joined) {
        setUserGroups([...userGroups, groupId]);
        setGroups(
          groups.map((g) =>
            g.id === groupId ? { ...g, memberCount: g.memberCount + 1 } : g
          )
        );
      } else {
        setUserGroups(userGroups.filter((id) => id !== groupId));
        setGroups(
          groups.map((g) =>
            g.id === groupId ? { ...g, memberCount: g.memberCount - 1 } : g
          )
        );
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Groups</h1>
        <p className="text-slate-600 mt-1">
          Join age-based communities to connect with parents like you
        </p>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const ageGroupStyle = AGE_GROUPS.find(
            (ag) => ag.ageMin === group.ageMin && ag.ageMax === group.ageMax
          );
          const isMember = userGroups.includes(group.id);

          return (
            <div
              key={group.id}
              className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <Link href={`/groups/${group.id}`} className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{group.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{group.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ageGroupStyle?.color || "bg-slate-100"
                        }`}
                      >
                        Ages {group.ageMin}-{group.ageMax}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 mt-2">{group.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>{group.memberCount} members</span>
                    <span>{group._count.posts} discussions</span>
                  </div>
                </Link>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleJoin(group.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isMember
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    }`}
                  >
                    {isMember ? "Joined" : "Join"}
                  </button>
                  <Link
                    href={`/groups/${group.id}`}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
