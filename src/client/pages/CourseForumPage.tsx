import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';
import { TopicListItem } from '../components/forum/TopicListItem';
import { ArrowLeft, Plus, MessageSquare } from 'lucide-react';

interface Topic {
  id: number;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  authorName: string;
  authorRole: string;
  replyCount: number;
  likeCount: number;
}

export function CourseForumPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { accessToken } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTopics = async () => {
    if (!accessToken || !courseId) return;
    try {
      const res = await apiFetch(`/api/forum/${courseId}/topics`, accessToken);
      const data = await res.json();
      setTopics(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tópicos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [accessToken, courseId]);

  const handleCreateTopic = async () => {
    if (!newTitle.trim() || !newContent.trim() || !accessToken || !courseId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/forum/${courseId}/topics`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }),
      });
      setNewTitle('');
      setNewContent('');
      setShowNewTopic(false);
      await loadTopics();
    } catch (err) {
      console.error('Failed to create topic:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/forum"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-lg font-bold text-slate-900">Fórum do Curso</h1>
          </div>
          <button
            onClick={() => setShowNewTopic(!showNewTopic)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Tópico
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* New Topic Form */}
        {showNewTopic && (
          <div className="mb-8 rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-display text-base font-bold text-slate-900">Criar Novo Tópico</h3>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Título da sua dúvida ou discussão"
              className="mb-3 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              maxLength={200}
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Descreva sua dúvida ou tema de discussão..."
              rows={4}
              className="mb-4 w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              maxLength={10000}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewTopic(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTopic}
                disabled={!newTitle.trim() || !newContent.trim() || submitting}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Publicando...' : 'Publicar Tópico'}
              </button>
            </div>
          </div>
        )}

        {/* Topics List */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Nenhum tópico ainda</h3>
            <p className="mt-2 text-sm text-slate-500">Seja o primeiro a iniciar uma discussão!</p>
          </div>
        )}

        {!loading && !error && topics.length > 0 && (
          <div className="flex flex-col gap-3">
            {topics.map(topic => (
              <TopicListItem key={topic.id} courseId={Number(courseId)} {...topic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
