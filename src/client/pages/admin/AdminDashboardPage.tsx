import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuthContext } from '../../context/AuthContext';

// --- TYPES ---
interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalCertificates: number;
  completionRate: number;
  recentActivity: Array<{
    type: 'certificate' | 'registration';
    student: string;
    course: string;
    action: string;
    date: string;
  }>;
  popularCourses: Array<{
    name: string;
    students: number;
  }>;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
}

export function AdminDashboardPage() {
  const { accessToken } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    fetch('/api/admin/dashboard/stats', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar dados');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Erro desconhecido');
        setLoading(false);
      });
  }, [accessToken]);

  // Build stats cards from real data
  const statCards = stats
    ? [
        {
          label: 'Total de Alunos',
          value: stats.totalStudents.toLocaleString('pt-BR'),
          icon: Users,
        },
        {
          label: 'Cursos Ativos',
          value: String(stats.totalCourses),
          icon: BookOpen,
        },
        {
          label: 'Certificados Emitidos',
          value: stats.totalCertificates.toLocaleString('pt-BR'),
          icon: Award,
        },
        {
          label: 'Taxa de Conclusão',
          value: `${stats.completionRate}%`,
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="text-black">Dashboard</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl flex items-center gap-3">
              <ShieldCheck className="text-brand" size={36} />
              Painel Administrativo
            </h1>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              Voltar ao Site
              <ArrowRight size={16} />
            </Button>
          </Link>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={48} className="animate-spin text-brand" />
              <p className="font-display font-bold text-lg">Carregando dados...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="border-2 border-red-600 bg-red-50 rounded-xl p-8 text-center shadow-brutal">
            <AlertTriangle size={48} className="mx-auto text-red-600 mb-4" />
            <h2 className="font-display font-bold text-xl text-red-600 mb-2">
              Erro ao carregar dashboard
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Content */}
        {stats && !loading && !error && (
          <>
            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              {statCards.map((stat) => (
                <Card key={stat.label} className="p-6 flex items-start justify-between group">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      {stat.label}
                    </p>
                    <p className="font-display font-bold text-4xl text-black mb-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className="bg-brand text-white p-3 rounded-full border-2 border-black shadow-brutal-sm group-hover:scale-110 transition-transform">
                    <stat.icon size={24} strokeWidth={2.5} />
                  </div>
                </Card>
              ))}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Recent Activity Table */}
              <section className="xl:col-span-2">
                <h2 className="font-display font-bold text-xl mb-4 uppercase tracking-wide">
                  Atividade Recente
                </h2>
                <div className="border-2 border-black rounded-xl shadow-brutal overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand text-white border-b-2 border-black">
                          <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">
                            Aluno
                          </th>
                          <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden sm:table-cell">
                            Curso
                          </th>
                          <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">
                            Ação
                          </th>
                          <th className="p-4 font-display font-bold uppercase tracking-wider text-sm text-right">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentActivity.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500">
                              Nenhuma atividade recente
                            </td>
                          </tr>
                        ) : (
                          stats.recentActivity.map((item, idx) => (
                            <tr
                              key={idx}
                              className="border-b-2 border-black last:border-none hover:bg-gray-50 transition-colors"
                            >
                              <td className="p-4 font-bold text-sm">{item.student}</td>
                              <td className="p-4 text-sm text-gray-600 hidden sm:table-cell max-w-[clamp(120px,18vw,200px)] truncate">
                                {item.course || '—'}
                              </td>
                              <td className="p-4 text-sm">
                                <span className="inline-block px-2 py-1 bg-emerald-50 border border-black text-xs font-bold uppercase">
                                  {item.action}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-500 text-right whitespace-nowrap">
                                {formatDate(item.date)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Popular Courses */}
              <section className="xl:col-span-1">
                <h2 className="font-display font-bold text-xl mb-4 uppercase tracking-wide">
                  Cursos Populares
                </h2>
                <div className="space-y-4">
                  {stats.popularCourses.length === 0 ? (
                    <Card className="p-6 text-center text-gray-500">
                      Nenhum dado de progresso ainda
                    </Card>
                  ) : (
                    stats.popularCourses.map((course, idx) => (
                      <Card key={idx} className="p-4 !shadow-brutal-sm">
                        <div className="flex justify-between items-end mb-2">
                          <h3 className="font-bold text-sm leading-tight line-clamp-2 pr-2">
                            <span className="text-brand mr-1">#{idx + 1}</span>
                            {course.name}
                          </h3>
                          <span className="text-xs font-bold whitespace-nowrap">
                            {course.students} alunos
                          </span>
                        </div>
                        {/* Brutalist Progress Bar — relative to max students */}
                        <div className="h-3 w-full bg-gray-200 border-2 border-black relative">
                          <div
                            className="h-full bg-brand border-r-2 border-black absolute top-0 left-0 bottom-0"
                            style={{
                              width: `${Math.min(
                                100,
                                (course.students /
                                  Math.max(...stats.popularCourses.map((c) => c.students), 1)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </Card>
                    ))
                  )}
                </div>
                <Link to="/admin/courses" className="block mt-6">
                  <Button variant="secondary" size="sm" className="w-full justify-center gap-2">
                    Ver Todos os Cursos
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
