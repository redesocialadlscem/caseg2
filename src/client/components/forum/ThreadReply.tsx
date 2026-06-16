import { useState } from 'react';
import { Heart, CornerDownRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';

interface Reply {
  id: number;
  parentReplyId: number | null;
  content: string;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorRole: string;
  likeCount: number;
  userLiked: boolean;
}

interface ThreadReplyProps {
  reply: Reply;
  allReplies: Reply[];
  topicId: number;
  depth?: number;
  onReplyAdded?: () => void;
}

export function ThreadReply({ reply, allReplies, topicId, depth = 0, onReplyAdded }: ThreadReplyProps) {
  const { accessToken } = useAuth();
  const [liked, setLiked] = useState(reply.userLiked);
  const [likes, setLikes] = useState(reply.likeCount);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const childReplies = allReplies.filter(r => r.parentReplyId === reply.id);
  const maxDepth = 3;
  const effectiveDepth = Math.min(depth, maxDepth);

  const handleLike = async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch('/api/forum/likes', accessToken, {
        method: 'POST',
        body: JSON.stringify({ targetType: 'reply', targetId: reply.id }),
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikes(prev => data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !accessToken) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/forum/topics/${topicId}/replies`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ content: replyContent.trim(), parentReplyId: reply.id }),
      });
      setReplyContent('');
      setShowReplyForm(false);
      onReplyAdded?.();
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const date = new Date(reply.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isAdmin = reply.authorRole === 'admin';

  return (
    <div className={`${effectiveDepth > 0 ? 'ml-5 border-l-2 border-black pl-4' : ''}`}>
      <article className="py-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black text-sm font-bold text-white shadow-brutal-sm ${
            isAdmin ? 'bg-black' : 'bg-brand'
          }`}>
            {reply.authorName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-sm font-bold uppercase text-black">
                {reply.authorName}
              </span>
              {isAdmin && (
                <span className="rounded-md border-2 border-black bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-brutal-sm">
                  Admin
                </span>
              )}
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{date}</span>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.content}</p>

            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                  liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} strokeWidth={2.5} />
                <span>{likes}</span>
              </button>

              {depth < maxDepth && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-gray-500 transition-colors hover:text-brand"
                >
                  <CornerDownRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>Responder</span>
                </button>
              )}
            </div>

            {showReplyForm && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder={`Respondendo a ${reply.authorName}...`}
                  className="flex-1 rounded-xl border-2 border-black bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-brand/30"
                  onKeyDown={e => e.key === 'Enter' && handleSubmitReply()}
                />
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || submitting}
                  className="rounded-xl border-2 border-black bg-brand px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-brutal-sm transition-colors hover:bg-brand-light disabled:opacity-50"
                >
                  {submitting ? '...' : 'Enviar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Render child replies recursively */}
      {childReplies.map(child => (
        <ThreadReply
          key={child.id}
          reply={child}
          allReplies={allReplies}
          topicId={topicId}
          depth={depth + 1}
          onReplyAdded={onReplyAdded}
        />
      ))}
    </div>
  );
}
