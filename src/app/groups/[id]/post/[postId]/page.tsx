"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; name: string };
}

interface Post {
  id: number;
  title: string;
  content: string;
  link: string | null;
  imageUrl: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  createdAt: string;
  user: { id: number; name: string };
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const fetchComments = () => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user) setCurrentUserId(data.user.id); })
      .catch(() => {});

    Promise.all([
      fetch(`/api/groups/${id}/posts`)
        .then((r) => r.json())
        .then((data) => {
          const found = (data.posts || []).find(
            (p: Post) => p.id === parseInt(postId)
          );
          setPost(found || null);
        }),
      fetch(`/api/posts/${postId}/comments`).then((r) => r.json()),
    ])
      .then(([, commentsData]) => {
        setComments(commentsData.comments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, postId]);

  const handleVote = async (value: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (post) {
        setPost({
          ...post,
          upvotes: data.post.upvotes,
          downvotes: data.post.downvotes,
          score: data.post.score,
        });
      }
    } catch {}
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        fetchComments();
        if (post) setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch {}
    setSubmitting(false);
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) router.push(`/groups/${id}`);
    } catch {}
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, { method: "DELETE" });
      if (res.ok) {
        fetchComments();
        if (post) setPost({ ...post, commentCount: post.commentCount - 1 });
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Post not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/groups/${id}`} className="text-teal-600 hover:underline text-sm mb-4 inline-block">
        &larr; Back to Group
      </Link>

      {/* Post */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-6">
        <div className="flex">
          <div className="flex flex-col items-center py-4 px-4 bg-slate-50">
            <button onClick={() => handleVote(1)} className="text-slate-400 hover:text-teal-600 text-lg">
              ▲
            </button>
            <span className="font-bold text-slate-700 my-1">{post.score}</span>
            <button onClick={() => handleVote(-1)} className="text-slate-400 hover:text-red-500 text-lg">
              ▼
            </button>
          </div>
          <div className="flex-1 p-6">
            <h1 className="text-xl font-bold text-slate-800">{post.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              <span>by {post.user.name}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              {currentUserId === post.user.id && (
                <button
                  onClick={handleDeletePost}
                  className="text-red-400 hover:text-red-600 transition-colors ml-auto"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-slate-700 mt-4 whitespace-pre-wrap">{post.content}</p>
            {post.imageUrl && (
              <div className="mt-4">
                <img
                  src={post.imageUrl}
                  alt="Post image"
                  className="w-full max-h-96 object-contain rounded-lg border border-slate-100"
                />
              </div>
            )}
            {post.link && (
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:underline mt-3 inline-block text-sm"
              >
                {post.link}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleComment} className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
        <h3 className="font-semibold text-slate-800 mb-3">Add a Comment</h3>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          placeholder="Share your thoughts..."
          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none mb-3"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Comment"}
        </button>
      </form>

      {/* Comments */}
      <h3 className="font-semibold text-slate-800 mb-4">
        Comments ({comments.length})
      </h3>
      {comments.length === 0 ? (
        <p className="text-slate-500 bg-white rounded-xl p-6 border border-slate-100">
          No comments yet. Be the first to respond!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-semibold text-xs">
                  {comment.user.name[0]}
                </div>
                <span className="font-medium text-sm text-slate-800">{comment.user.name}</span>
                <span className="text-xs text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {currentUserId === comment.user.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-400 hover:text-red-600 text-xs transition-colors ml-auto"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-slate-600 text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
