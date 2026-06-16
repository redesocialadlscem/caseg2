import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, ChevronRight, ArrowLeft, Users, Send, Target,
  Timer, Trophy, Zap, AlertTriangle,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';

interface AlunoRow {
  name: string;
  received: number;
  answered: number;
  correct: number;
  errors: number;
  responseRatePct: number;
  attention: number;
  avgMs: number;
  points: number;
}

interface Analytics {
  released: number;
  turma: {
    participants: number;
    interactionsReleased: number;
    responseRatePct: number;
    correctRatePct: number;
    avgResponseMs: number;
  };
  alunos: AlunoRow[];
}

const fmtSeconds = (ms: number) => (ms ? `${(ms / 1000).toFixed(1)}s` : '—');

const attentionColor = (v: number) =>
  v >= 80 ? 'text-brand' : v >= 50 ? 'text-yellow-600' : 'text-red-600';

export function AdminLiveAnalyticsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [title, setTitle] = useState('Relatório da Aula');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/live-sessions/${sessionId}/analytics`, accessToken);
      setData(await res.json());
      // título vem do endpoint público de status (não bloqueia o relatório se falhar)
      try {
        const st = await fetch(`/api/live-sessions/${sessionId}/status`).then(r => r.json());
        if (st?.title) setTitle(st.title);
      } catch { /* ignore */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }, [sessionId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const turma = data?.turma;

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
            <button onClick={() => navigate('/admin/live-sessions')} className="hover:text-black transition-colors">Portal Corporativo</button>
            <ChevronRight size={14} />
            <span className="text-black">Relatório</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="font-display font-bold text-3xl sm:text-4xl flex items-center gap-3">
              <BarChart3 className="text-brand" size={36} />
              {title}
            </h1>
            <Button variant="secondary" onClick={() => navigate('/admin/live-sessions')} className="gap-2 shrink-0">
              <ArrowLeft size={16} /> Voltar
            </Button>
          </div>
        </header>

        {loading && <p className="text-gray-500">Carregando relatório…</p>}
        {error && (
          <Card className="p-6 border-red-600 bg-red-50 flex items-center gap-3">
            <AlertTriangle className="text-red-600" /> <span className="font-bold text-red-700">{error}</span>
          </Card>
        )}

        {!loading && !error && turma && (
          <>
            {/* Relatório da Turma */}
            <h2 className="font-display font-bold text-xl uppercase tracking-wide mb-4">Relatório da Turma</h2>
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
              <StatCard icon={Users} tone="bg-blue-50 text-blue-700" label="Participantes" value={String(turma.participants)} />
              <StatCard icon={Send} tone="bg-indigo-50 text-indigo-700" label="Interações" value={String(turma.interactionsReleased)} />
              <StatCard icon={Target} tone="bg-emerald-50 text-brand" label="Taxa de resposta" value={`${turma.responseRatePct}%`} />
              <StatCard icon={Trophy} tone="bg-amber-50 text-amber-700" label="Taxa de acerto" value={`${turma.correctRatePct}%`} />
              <StatCard icon={Timer} tone="bg-rose-50 text-rose-700" label="Tempo médio" value={fmtSeconds(turma.avgResponseMs)} />
            </section>

            {/* Relatório Individual */}
            <h2 className="font-display font-bold text-xl uppercase tracking-wide mb-4">Relatório Individual</h2>
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-brand text-white border-b-2 border-black text-sm uppercase tracking-wide">
                      <th className="p-4">#</th>
                      <th className="p-4">Aluno</th>
                      <th className="p-4 text-center">Recebidas</th>
                      <th className="p-4 text-center">Respondidas</th>
                      <th className="p-4 text-center">Acertos</th>
                      <th className="p-4 text-center">Erros</th>
                      <th className="p-4 text-center hidden sm:table-cell">Tempo méd.</th>
                      <th className="p-4 text-center">Atenção</th>
                      <th className="p-4 text-right">Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.alunos.length === 0 && (
                      <tr><td colSpan={9} className="p-8 text-center text-gray-500">Nenhum participante registrado nesta aula.</td></tr>
                    )}
                    {data!.alunos.map((a, i) => (
                      <tr key={a.name} className="border-b-2 border-black last:border-none hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-display font-bold">{i + 1}</td>
                        <td className="p-4 font-bold">{a.name}</td>
                        <td className="p-4 text-center">{a.received}</td>
                        <td className="p-4 text-center">{a.answered}</td>
                        <td className="p-4 text-center text-brand font-bold">{a.correct}</td>
                        <td className="p-4 text-center text-red-600 font-bold">{a.errors}</td>
                        <td className="p-4 text-center hidden sm:table-cell text-gray-600">{fmtSeconds(a.avgMs)}</td>
                        <td className={`p-4 text-center font-display font-bold ${attentionColor(a.attention)}`}>
                          <span className="inline-flex items-center gap-1"><Zap size={13} strokeWidth={2.5} />{a.attention}%</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="inline-block rounded-lg border-2 border-black bg-brand px-2.5 py-1 text-xs font-bold text-white">{a.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value }: { icon: typeof Users; tone: string; label: string; value: string }) {
  return (
    <Card className="p-5 flex items-start justify-between group">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 leading-tight">{label}</p>
        <p className="font-display font-bold text-3xl text-black">{value}</p>
      </div>
      <div className={`${tone} p-2.5 rounded-full border-2 border-black shadow-brutal-sm group-hover:scale-110 transition-transform shrink-0`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </Card>
  );
}
