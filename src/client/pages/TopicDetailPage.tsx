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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="rounded-xl border-2 border-black bg-white p-6 text-center font-bold text-red-600 shadow-brutal">
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
    <div className="min-h-screen bg-gray-50">
      {/* Admin Moderation Bar */}
      {isAdmin && (
        <div className="sticky top-0 z-20 border-b-2 border-black bg-black px-6 py-2 text-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-amber-300">
              Modo Moderador Ativo
            </span>
            <button
              onClick={handlePinToggle}
              className={`flex items-center gap-1.5 rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-brutal-sm transition-colors ${
                topic.isPinned
                  ? 'bg-amber-300 text-black hover:bg-amber-200'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <Pin className="h-3.5 w-3.5" strokeWidth={2.5} />
              {topic.isPinned ? 'Desafixar' : 'Fixar Tópico'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <Link
            to={`/forum/${courseId}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white text-black shadow-brutal-sm brutal-interactive"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Fórum do Curso</p>
            <h1 className="truncate font-display text-lg font-bold uppercase text-black">{topic.title}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Original Post */}
        <article className="mb-8 rounded-xl border-2 border-black bg-emerald-50 p-6 shadow-brutal">
          <div className="mb-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black text-sm font-bold text-white shadow-brutal-sm ${
              topic.authorRole === 'admin' ? 'bg-black' : 'bg-brand'
            }`}>
              {topic.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold uppercase text-black">
                  {topic.authorName}
                </span>
                {topic.authorRole === 'admin' && (
                  <span className="rounded-md border-2 border-black bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-brutal-sm">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{date}</p>
            </div>
          </div>

          <p className="font-body leading-relaxed text-gray-800 whitespace-pre-wrap">{topic.content}</p>

          <div className="mt-4 flex items-center gap-4 border-t-2 border-black/10 pt-4">
            <button
              onClick={handleLikeTopic}
              className={`flex items-center gap-1.5 rounded-lg border-2 border-black px-3 py-1.5 text-sm font-bold uppercase tracking-wide shadow-brutal-sm transition-colors ${
                liked ? 'bg-red-600 text-white' : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} strokeWidth={2.5} />
              <span>{likes} curtidas</span>
            </button>
            {topic.isLocked && (
              <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-red-600">
                <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
                Tópico trancado
              </span>
            )}
          </div>
        </article>

        {/* Replies */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-base font-bold uppercase tracking-tight text-black">
            Respostas ({replies.length})
          </h2>
          <div className="divide-y-2 divide-black/10 rounded-xl border-2 border-black bg-white px-4 shadow-brutal">
            {rootReplies.map(reply => (
              <ThreadReply
                key={reply.id}
                reply={reply}
                allReplies={replies}
                topicId={topic.id}
                onReplyAdded={loadData}
              />
            ))}
            {rootReplies.length === 0 && (
              <p className="py-8 text-center font-body text-sm text-gray-400">
                Nenhuma resposta ainda. Seja o primeiro a responder!
              </p>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {!topic.isLocked && (
          <div className="rounded-xl border-2 border-black bg-white p-5 shadow-brutal">
            <h3 className="mb-3 font-display text-sm font-bold uppercase text-black">Sua Resposta</h3>
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Escreva sua resposta..."
              rows={3}
              className="mb-3 w-full resize-none rounded-xl border-2 border-black px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand/30"
              maxLength={5000}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || submitting}
                className="flex items-center gap-2 rounded-xl border-2 border-black bg-brand px-5 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-brutal-sm transition-colors hover:bg-brand-light disabled:opacity-50"
              >
                <Send className="h-4 w-4" strokeWidth={2.5} />
                {submitting ? 'Enviando...' : 'Publicar Resposta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
