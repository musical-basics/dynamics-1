'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import {
  parseCommentTimecodes,
  formatTimecode,
  type TextSegment,
} from '@/lib/utils/timecode';
import { getCurrentTime } from '@/lib/audio/audioEngine';

interface Comment {
  id: string;
  body: string;
  timestampMs: number | null;
  parentId: string | null;
  createdAt: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Props {
  releaseId: string;
}

export default function CommentsPanel({ releaseId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { seek } = usePlayerStore();

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/comments/${releaseId}`);
        const data = await res.json();
        setComments(data.comments || []);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };
    fetchComments();
  }, [releaseId]);

  // Post comment (auto-capture current playback time)
  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setLoading(true);

    try {
      const timestampMs = Math.round(getCurrentTime() * 1000);
      const res = await fetch(`/api/comments/${releaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: newComment.trim(),
          timestampMs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimecodeClick = (seconds: number) => {
    seek(seconds);
  };

  const renderCommentBody = (body: string) => {
    const segments = parseCommentTimecodes(body);
    return segments.map((seg: TextSegment, i: number) => {
      if (seg.type === 'timecode') {
        return (
          <button
            key={i}
            onClick={() => handleTimecodeClick(seg.seconds!)}
            className="text-accent hover:text-accent-dim transition-colors font-mono text-xs bg-accent/10 px-1 rounded"
          >
            {seg.content}
          </button>
        );
      }
      return <span key={i}>{seg.content}</span>;
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Comments</h3>

      {/* New Comment */}
      <div className="flex gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || !newComment.trim()}
        className="text-xs bg-accent text-background px-3 py-1.5 rounded-md hover:bg-accent-dim transition-colors disabled:opacity-50"
      >
        {loading ? 'Posting...' : 'Comment'}
      </button>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-xs text-text-tertiary flex-shrink-0">
              {comment.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-medium">
                  {comment.displayName || 'Anonymous'}
                </span>
                {comment.timestampMs !== null && (
                  <button
                    onClick={() => handleTimecodeClick(comment.timestampMs! / 1000)}
                    className="text-accent text-[10px] font-mono bg-accent/10 px-1 rounded"
                  >
                    {formatTimecode(comment.timestampMs / 1000)}
                  </button>
                )}
              </div>
              <p className="text-sm text-text-secondary mt-0.5 break-words">
                {renderCommentBody(comment.body)}
              </p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-4">
            No comments yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
}
