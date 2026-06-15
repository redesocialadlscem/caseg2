import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';
import { ThreadReply } from '../components/forum/ThreadReply';
import { ArrowLeft, Heart, Pin, Lock, Send } from 'lucide-react';

interface TopicDetail {
  id: number;
  courseId: number;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorRole: string;
  likeCount: number;
  userLiked: boolean;
}

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

export function TopicDetailPage() {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const { accessToken, user } = useAuth();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  const loadData = useCallback(async () => {
    if (!accessToken || !topicId) return;
    try {
      const res = await apiFetch(`/api/forum/topics/${topicId}`, accessToken);
      const data = await res.json();
      setTopic(data.topic);
      setReplies(data.replies);
      setLiked(data.topic.userLiked);
      setLikes(data.topic.likeCount);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tópico');
    } finally {
      setLoading(false);
    }
  }, [accessToken, topicId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLikeTopic = async () => {
    if (!accessToken || !topic) return;
    try {
      const res = await apiFetch('/api/forum/likes', accessToken, {
        method: 'POST',
        body: JSON.stringify({ targetType: 'topic', targetId: topic.id }),
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikes(prev => data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !accessToken || !topicId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/forum/topics/${topicId}/replies`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      setReplyContent('');
      await loadData();
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinToggle = async () => {
    if (!accessToken || !topic || user?.role !== 'admin') return;
    try {
      await apiFetch(`/api/forum/topics/${topic.id}/pin`, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ isPinned: !topic.isPinned }),
      });
      setTopic(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null);
    } catch (err) {
      console.error('Failed to pin/unpin:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error || 'Tópico não encontrado'}
        </div>
      </div>
    );
  }

  const date = new Date(topic.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isAdmin = user?.role === 'admin';
  const rootReplies = replies.filter(r => r.parentReplyId === null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Moderation Bar */}
      {isAdmin && (
        <div className="sticky top-0 z-20 border-b border-indigo-200 bg-indigo-50 px-6 py-2">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Modo Moderador Ativo
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePinToggle}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  topic.isPinned
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <Pin className="h-3.5 w-3.5" />
                {topic.isPinned ? 'Desafixar' : 'Fixar Tópico'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <Link
            to={`/forum/${courseId}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Fórum do Curso</p>
            <h1 className="font-display text-lg font-bold text-slate-900 truncate">{topic.title}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Original Post */}
        <article className="mb-8 rounded-xl border border-emerald-100 bg-emerald-50/30 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
              topic.authorRole === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}>
              {topic.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${topic.authorRole === 'admin' ? 'text-indigo-700' : 'text-slate-900'}`}>
                  {topic.authorName}
                </span>
                {topic.authorRole === 'admin' && (
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{date}</p>
            </div>
          </div>

          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{topic.content}</p>

          <div className="mt-4 flex items-center gap-4 border-t border-emerald-100 pt-4">
            <button
              onClick={handleLikeTopic}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                liked
                  ? 'bg-rose-50 font-semibold text-rose-600'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-rose-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likes} curtidas</span>
            </button>
            {topic.isLocked && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Lock className="h-3.5 w-3.5" />
                Tópico trancado
              </span>
            )}
          </div>
        </article>

        {/* Replies */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900">
            Respostas ({replies.length})
          </h2>
          <div className="divide-y divide-slate-100">
            {rootReplies.map(reply => (
              <ThreadReply
                key={reply.id}
                reply={reply}
                allReplies={replies}
                topicId={topic.id}
                onReplyAdded={loadData}
              />
            ))}
          </div>
          {rootReplies.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhuma resposta ainda. Seja o primeiro a responder!
            </p>
          )}
        </div>

        {/* Reply Form */}
        {!topic.isLocked && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Sua Resposta</h3>
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Escreva sua resposta..."
              rows={3}
              className="mb-3 w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              maxLength={5000}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || submitting}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Enviando...' : 'Publicar Resposta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
