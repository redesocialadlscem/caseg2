import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';
import { ForumCourseCard } from '../components/forum/ForumCourseCard';
import { MessageSquare, BookOpen } from 'lucide-react';

interface ForumCourse {
  id: number;
  title: string;
  imageUrl: string;
  category: string;
}

export function ForumDashboardPage() {
  const { accessToken } = useAuth();
  const [courses, setCourses] = useState<ForumCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!accessToken) return;
      try {
        const res = await apiFetch('/api/forum/courses', accessToken);
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar fóruns');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header brutalista */}
      <div className="border-b-2 border-black bg-brand px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-white text-brand shadow-brutal-sm">
              <MessageSquare className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Comunidade CASEG
            </h1>
          </div>
          <p className="max-w-xl font-body text-base text-emerald-50">
            Tire dúvidas, compartilhe experiências e aprenda com colegas e instrutores dos seus cursos.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-10">
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

        {!loading && !error && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-black bg-white p-16 text-center shadow-brutal">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-black bg-gray-100 text-gray-400">
              <BookOpen className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <h3 className="font-display text-lg font-bold uppercase text-black">Nenhum fórum disponível</h3>
            <p className="mt-2 max-w-sm font-body text-sm text-gray-600">
              Você precisa estar matriculado em pelo menos um curso para acessar os fóruns de discussão.
            </p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            <h2 className="mb-6 font-display text-xl font-bold uppercase tracking-tight text-black">
              Seus Fóruns ({courses.length})
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map(course => (
                <ForumCourseCard key={course.id} {...course} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
