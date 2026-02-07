"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface Post {
  id: number;
  title: string;
  content: string;
  link: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  createdAt: string;
  user: { id: number; name: string };
}

interface Group {
  id: number;
  name: string;
  description: string;
  ageMin: number;
  ageMax: number;
  memberCount: number;
  icon: string;
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sort, setSort] = useState("hot");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = () => {
    fetch(`/api/groups/${id}/posts?sort=${sort}`)
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      fetch(`/api/groups/${id}`).then((r) => r.json()),
      fetch(`/api/groups/${id}/posts?sort=${sort}`).then((r) => r.json()),
    ])
      .then(([groupData, postsData]) => {
        setGroup(groupData.group);
        setPosts(postsData.posts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading) fetchPosts();
  }, [sort]);

  const handleVote = async (postId: number, value: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? { ...p, upvotes: data.post.upvotes, downvotes: data.post.downvotes, score: data.post.score }
            : p
        )
      );
    } catch {}
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, link: link || undefined }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setLink("");
        setShowForm(false);
        fetchPosts();
      }
    } catch {}
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Group not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/groups" className="text-teal-600 hover:underline text-sm mb-4 inline-block">
        &larr; Back to Groups
      </Link>

      {/* Group Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{group.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>
            <p className="text-slate-500">Ages {group.ageMin}-{group.ageMax} &middot; {group.memberCount} members</p>
          </div>
        </div>
        <p className="text-slate-600 mt-3">{group.description}</p>
      </div>

      {/* Create Post */}
      <div className="mb-6">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-white rounded-xl p-4 border border-slate-100 text-left text-slate-400 hover:border-teal-300 transition-colors"
          >
            Share something with the community...
          </button>
        ) : (
          <form onSubmit={handleSubmitPost} className="bg-white rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Create a Post</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3"
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none mb-3"
              required
            />
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Link (optional)"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sort Tabs */}
      <div className="flex gap-2 mb-6">
        {["hot", "new", "top"].map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              sort === s
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <p className="text-slate-500">No posts yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-slate-100 overflow-hidden"
            >
              <div className="flex">
                {/* Vote column */}
                <div className="flex flex-col items-center py-4 px-3 bg-slate-50">
                  <button
                    onClick={() => handleVote(post.id, 1)}
                    className="text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    ▲
                  </button>
                  <span className="font-semibold text-sm text-slate-700 my-1">{post.score}</span>
                  <button
                    onClick={() => handleVote(post.id, -1)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    ▼
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <Link href={`/groups/${id}/post/${post.id}`}>
                    <h3 className="font-semibold text-slate-800 hover:text-teal-600 transition-colors">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-slate-600 text-sm mt-1 line-clamp-2">{post.content}</p>
                  {post.link && (
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 text-sm hover:underline mt-1 inline-block"
                    >
                      {post.link}
                    </a>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>by {post.user.name}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <Link
                      href={`/groups/${id}/post/${post.id}`}
                      className="hover:text-teal-600"
                    >
                      {post.commentCount} comments
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
