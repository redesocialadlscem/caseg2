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
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900 px-6 py-16 text-white">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <MessageSquare className="h-6 w-6 text-emerald-300" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Comunidade CASEG</h1>
          </div>
          <p className="max-w-xl text-lg text-emerald-100/80">
            Tire dúvidas, compartilhe experiências e aprenda com colegas e instrutores dos seus cursos.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-10">
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

        {!loading && !error && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Nenhum fórum disponível</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Você precisa estar matriculado em pelo menos um curso para acessar os fóruns de discussão.
            </p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            <h2 className="mb-6 font-display text-xl font-bold text-slate-900">
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
