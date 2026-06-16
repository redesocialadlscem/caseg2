import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface CourseProgress {
  courseId: number;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

interface ProgressStats {
  coursesInProgress: number;
  coursesCompleted: number;
  totalCompletedLessons: number;
  estimatedHours: number;
  overallProgress: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthContext();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  const welcomeName = useMemo(() => {
    if (!user?.name) return 'Aluno';
    return user.name.split(' ')[0];
  }, [user]);

  useEffect(() => {
    async function fetchProgress() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/progress/my', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          setStats(data.stats || null);
        }
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, [accessToken]);

  const statCards = useMemo(() => {
    if (!stats) {
      return [
        { label: 'Cursos em Andamento', value: '—', icon: BookOpen, variant: 'brand' as const },
        { label: 'Cursos Concluídos', value: '—', icon: Award, variant: 'black' as const },
        { label: 'Horas de Treinamento', value: '—', icon: Clock, variant: 'brand' as const },
        { label: 'Progresso Geral', value: '—', icon: TrendingUp, variant: 'black' as const },
      ];
    }
    return [
      { label: 'Cursos em Andamento', value: String(stats.coursesInProgress), icon: BookOpen, variant: 'brand' as const },
      { label: 'Cursos Concluídos', value: String(stats.coursesCompleted), icon: Award, variant: 'black' as const },
      { label: 'Horas de Treinamento', value: `${stats.estimatedHours}h`, icon: Clock, variant: 'brand' as const },
      { label: 'Progresso Geral', value: `${stats.overallProgress}%`, icon: TrendingUp, variant: 'black' as const },
    ];
  }, [stats]);

  return (
    <Layout>
      {/* Welcome Banner */}
      <section className="mb-10 sm:mb-14">
        <div className="bg-brand text-white border-2 border-black shadow-brutal rounded-xl overflow-hidden">
          <div className="px-8 py-10">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr] items-center">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Bem-vindo de volta</p>
                <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight leading-[1.05]">
                  Olá, {welcomeName}
                </h1>
                <p className="font-body text-base sm:text-lg text-white max-w-2xl leading-relaxed">
                  Continue de onde parou, acompanhe seu progresso e mantenha sua certificação em dia com treinamentos focados em segurança do trabalho.
                </p>
              </div>

              {/* Quick Summary Card */}
              <div className="rounded-xl border-2 border-black bg-black p-6 text-white shadow-brutal-sm">
                <p className="font-display font-bold text-2xl uppercase tracking-tight">Resumo rápido</p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-white px-4 py-3">
                    <span className="font-body text-sm uppercase tracking-wide">Cursos ativos</span>
                    <span className="font-display font-bold text-lg">{stats ? stats.coursesInProgress : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-white px-4 py-3">
                    <span className="font-body text-sm uppercase tracking-wide">Concluídos</span>
                    <span className="font-display font-bold text-lg">{stats ? stats.coursesCompleted : '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-brutal brutal-interactive hover:bg-white hover:text-black"
              >
                Ver Catálogo
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/certificates')}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-brutal brutal-interactive hover:bg-white hover:text-black"
              >
                <Award size={18} strokeWidth={2.5} />
                Meus Certificados
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Continue Studying */}
        <div>
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight">
                Continuar Estudando
              </h2>
              <p className="font-body text-sm text-gray-600">
                Cursos em andamento com progresso e próximos passos.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
              Ver Todos
            </Button>
          </div>

          <div className="space-y-5">
            {loading ? (
              <Card className="p-5">
                <p className="font-body text-sm text-gray-500">Carregando progresso...</p>
              </Card>
            ) : courses.length === 0 ? (
              <Card className="p-5">
                <div className="flex flex-col items-center text-center gap-3">
                  <CheckCircle2 size={32} className="text-brand" strokeWidth={2.5} />
                  <p className="font-body text-sm text-gray-600">
                    Nenhum curso em andamento ainda. Explore o catálogo e comece a estudar!
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/courses')}>
                    Explorar Cursos
                  </Button>
                </div>
              </Card>
            ) : (
              courses.map((course) => (
                <Card key={course.courseId} className="p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="font-display font-bold text-lg uppercase tracking-tight">
                          {course.title}
                        </p>
                        <p className="font-body text-xs uppercase tracking-wide text-gray-500 mt-1">
                          {course.category}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand border-2 border-black px-3 py-1 text-xs font-bold uppercase text-white shadow-brutal-sm">
                        {course.progress}%
                      </span>
                    </div>

                    <ProgressBar value={course.progress} size="md" />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-body text-sm text-gray-500">
                        {course.completedLessons}/{course.totalLessons} lições concluídas
                      </p>
                      <Button
                        variant="dark"
                        size="sm"
                        className="w-full sm:w-auto gap-2"
                        onClick={() => navigate(`/courses/${course.courseId}/player`)}
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity — derived from course progress until dedicated endpoint exists */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight">
              Atividade Recente
            </h2>
          </div>

          <Card className="p-6">
            {loading ? (
              <p className="font-body text-sm text-gray-500">Carregando...</p>
            ) : courses.length === 0 ? (
              <p className="font-body text-sm text-gray-500">Nenhuma atividade registrada.</p>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.courseId} className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-brand text-white shadow-brutal-sm">
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-body text-sm text-gray-800">
                        Progrediu em <strong>{course.title}</strong> — {course.progress}% concluído
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                        {course.completedLessons}/{course.totalLessons} lições
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </Layout>
  );
}
