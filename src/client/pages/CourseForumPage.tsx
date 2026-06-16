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

  const inputClass =
    'w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand/30';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/forum"
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white text-black shadow-brutal-sm brutal-interactive"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <h1 className="font-display text-lg font-bold uppercase tracking-tight text-black">Fórum do Curso</h1>
          </div>
          <button
            onClick={() => setShowNewTopic(!showNewTopic)}
            className="flex items-center gap-2 rounded-xl border-2 border-black bg-brand px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-brutal-sm transition-colors hover:bg-brand-light"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Novo Tópico
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* New Topic Form */}
        {showNewTopic && (
          <div className="mb-8 rounded-xl border-2 border-black bg-white p-6 shadow-brutal">
            <h3 className="mb-4 font-display text-base font-bold uppercase text-black">Criar Novo Tópico</h3>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Título da sua dúvida ou discussão"
              className={`mb-3 ${inputClass}`}
              maxLength={200}
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Descreva sua dúvida ou tema de discussão..."
              rows={4}
              className={`mb-4 resize-none ${inputClass}`}
              maxLength={10000}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewTopic(false)}
                className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide text-black shadow-brutal-sm transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTopic}
                disabled={!newTitle.trim() || !newContent.trim() || submitting}
                className="rounded-xl border-2 border-black bg-brand px-6 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-brutal-sm transition-colors hover:bg-brand-light disabled:opacity-50"
              >
                {submitting ? 'Publicando...' : 'Publicar Tópico'}
              </button>
            </div>
          </div>
        )}

        {/* Topics List */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border-2 border-black bg-white p-6 text-center font-bold text-red-600 shadow-brutal">
            {error}
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-black bg-white p-16 text-center shadow-brutal">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-black bg-gray-100 text-gray-400">
              <MessageSquare className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <h3 className="font-display text-lg font-bold uppercase text-black">Nenhum tópico ainda</h3>
            <p className="mt-2 font-body text-sm text-gray-600">Seja o primeiro a iniciar uma discussão!</p>
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
