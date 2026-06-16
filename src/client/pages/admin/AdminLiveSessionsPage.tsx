import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video, Plus, Calendar, Clock, Building2, Users,
  Award, CheckCircle2, XCircle, PlayCircle, Download,
  ChevronRight, ShieldCheck, MoreHorizontal, LogIn, BarChart3
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../hooks/useAuth';

type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

interface LiveSession {
  id: number;
  title: string;
  courseName: string;
  companyCode: string;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  jitsiRoom: string;
  createdAt: string;
}

interface Participant {
  id: number;
  sessionId: number;
  employeeName: string;
  companyCode: string;
  joinedAt: string;
  completedAt: string | null;
  certificateIssued: boolean;
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; icon: typeof PlayCircle }> = {
  scheduled: { label: 'Agendada', color: 'bg-blue-50 text-blue-700 border-blue-600', icon: Calendar },
  live: { label: 'Ao Vivo', color: 'bg-red-50 text-red-700 border-red-600', icon: PlayCircle },
  completed: { label: 'Finalizada', color: 'bg-emerald-50 text-brand border-brand', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500 border-gray-400', icon: XCircle },
};

export function AdminLiveSessionsPage() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'certificates'>('sessions');
  const [createForm, setCreateForm] = useState({ title: '', courseName: '', companyCode: '', date: '', time: '', duration: '60', nrReference: '', validityMonths: '0', instructorName: '', instructorTitle: '' });

  const [downloadingZip, setDownloadingZip] = useState(false);
  const [issuingKey, setIssuingKey] = useState<string | null>(null);
  const [issuingAll, setIssuingAll] = useState(false);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

  // ID da sessão selecionada (para download em massa)
  const selectedSessionId = sessions.find(s => s.status === 'completed')?.id ?? sessions[0]?.id;

  const handleBulkDownload = async () => {
    if (!selectedSessionId) return;
    setDownloadingZip(true);
    try {
      const res = await fetch(`/api/admin/live-sessions/${selectedSessionId}/certificates/bulk-download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Falha no download' }));
        alert(err.error || 'Erro ao baixar certificados');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificados_aula_${selectedSessionId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Erro inesperado');
    } finally {
      setDownloadingZip(false);
    }
  };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/live-sessions', { headers });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Carregar participantes de todas as sessões (para a aba certificados)
  const fetchAllParticipants = useCallback(async () => {
    const all: Participant[] = [];
    for (const s of sessions) {
      try {
        const res = await fetch(`/api/admin/live-sessions/${s.id}/participants`, { headers });
        if (res.ok) {
          const data = await res.json();
          all.push(...(data.participants || []));
        }
      } catch { /* ignore */ }
    }
    setParticipants(all);
  }, [sessions, accessToken]);

  useEffect(() => {
    if (sessions.length > 0) fetchAllParticipants();
  }, [sessions, fetchAllParticipants]);

  // Emite o certificado de um participante (respeita o gate de regras; força com confirmação)
  const issueCertificate = async (p: Participant, force = false) => {
    const key = `${p.sessionId}:${p.employeeName}`;
    setIssuingKey(key);
    try {
      const res = await fetch(`/api/admin/live-sessions/${p.sessionId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ employeeName: p.employeeName, companyCode: p.companyCode, force }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        const reasons = (data.blockedBy || []).map((r: string) => `• ${r}`).join('\n');
        if (confirm(`${p.employeeName} não cumpre as regras de certificação:\n\n${reasons}\n\nEmitir o certificado mesmo assim?`)) {
          await issueCertificate(p, true);
        }
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Falha ao emitir o certificado.');
        return;
      }
      await fetchAllParticipants();
    } catch {
      alert('Erro inesperado ao emitir o certificado.');
    } finally {
      setIssuingKey(null);
    }
  };

  const sessionTitle = (id: number) => sessions.find(s => s.id === id)?.title || `Aula #${id}`;

  // Emite de uma vez todos os pendentes que cumprem as regras (sem forçar).
  const issueAllEligible = async () => {
    const pending = participants.filter(p => !p.certificateIssued);
    if (pending.length === 0) return;
    if (!confirm(`Emitir certificado para os participantes aprovados?\n\nSerão avaliados ${pending.length} pendente(s). Quem não cumprir as regras de certificação será ignorado.`)) return;
    setIssuingAll(true);
    let issued = 0, blocked = 0, failed = 0;
    for (const p of pending) {
      try {
        const res = await fetch(`/api/admin/live-sessions/${p.sessionId}/complete`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ employeeName: p.employeeName, companyCode: p.companyCode }), // sem force
        });
        if (res.ok) issued++;
        else if (res.status === 409) blocked++;
        else failed++;
      } catch { failed++; }
    }
    await fetchAllParticipants();
    setIssuingAll(false);
    alert(
      `✅ ${issued} certificado(s) emitido(s).` +
      (blocked ? `\n⛔ ${blocked} ignorado(s) — não cumprem as regras.` : '') +
      (failed ? `\n⚠️ ${failed} com erro.` : ''),
    );
  };

  const handleCreate = async () => {
    if (!createForm.title || !createForm.companyCode || !createForm.date) return;
    const scheduledAt = new Date(`${createForm.date}T${createForm.time || '09:00'}`).toISOString();
    try {
      const res = await fetch('/api/admin/live-sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: createForm.title,
          courseName: createForm.courseName || createForm.title,
          companyCode: createForm.companyCode,
          scheduledAt,
          durationMinutes: Number(createForm.duration) || 60,
          nrReference: createForm.nrReference,
          validityMonths: Number(createForm.validityMonths) || 0,
          instructorName: createForm.instructorName,
          instructorTitle: createForm.instructorTitle,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ title: '', courseName: '', companyCode: '', date: '', time: '', duration: '60', nrReference: '', validityMonths: '0', instructorName: '', instructorTitle: '' });
        fetchSessions();
      }
    } catch { /* ignore */ }
  };

  const handleStatusChange = async (id: number, status: SessionStatus) => {
    try {
      await fetch(`/api/admin/live-sessions/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      fetchSessions();
    } catch { /* ignore */ }
  };

  // Stats calculados dos dados reais
  const certificates = participants.filter(p => p.certificateIssued);
  // Todos os participantes, pendentes de certificado primeiro
  const participantsSorted = [...participants].sort(
    (a, b) => Number(a.certificateIssued) - Number(b.certificateIssued),
  );
  const pendingCount = participants.filter(p => !p.certificateIssued).length;
  const upcomingCount = sessions.filter(s => s.status === 'scheduled').length;
  const certifiedCount = certificates.length;
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalCompletedParticipants = completedSessions.length > 0
    ? participants.filter(p => completedSessions.some(s => s.id === p.sessionId)).length
    : 0;
  const completionRate = totalCompletedParticipants > 0
    ? Math.round((certifiedCount / totalCompletedParticipants) * 100)
    : 0;

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
              <span className="text-black">Portal Corporativo</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl flex items-center gap-3">
              <Video className="text-brand" size={36} />
              Portal Corporativo
            </h1>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 shrink-0">
            <Plus size={18} />
            Criar Aula
          </Button>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <Card className="p-6 flex items-start justify-between group">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Próximas Aulas</p>
              <p className="font-display font-bold text-4xl text-black">{upcomingCount}</p>
            </div>
            <div className="bg-blue-50 text-blue-700 p-3 rounded-full border-2 border-black shadow-brutal-sm group-hover:scale-110 transition-transform">
              <Calendar size={24} strokeWidth={2.5} />
            </div>
          </Card>
          <Card className="p-6 flex items-start justify-between group">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Certificados Gerados</p>
              <p className="font-display font-bold text-4xl text-black">{certifiedCount}</p>
            </div>
            <div className="bg-emerald-50 text-brand p-3 rounded-full border-2 border-black shadow-brutal-sm group-hover:scale-110 transition-transform">
              <Award size={24} strokeWidth={2.5} />
            </div>
          </Card>
          <Card className="p-6 flex items-start justify-between group">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Taxa de Conclusão</p>
              <p className="font-display font-bold text-4xl text-black">{completionRate}%</p>
            </div>
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-full border-2 border-black shadow-brutal-sm group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
          </Card>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 font-display font-bold text-sm uppercase tracking-wide border-2 border-black rounded-xl transition-all ${
              activeTab === 'sessions'
                ? 'bg-brand text-white shadow-brutal'
                : 'bg-white text-black shadow-brutal hover:bg-gray-50 brutal-interactive'
            }`}
          >
            Aulas ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-3 font-display font-bold text-sm uppercase tracking-wide border-2 border-black rounded-xl transition-all ${
              activeTab === 'certificates'
                ? 'bg-brand text-white shadow-brutal'
                : 'bg-white text-black shadow-brutal hover:bg-gray-50 brutal-interactive'
            }`}
          >
            Certificados ({certificates.length})
          </button>
        </div>

        {/* Tab Content: Sessions */}
        {activeTab === 'sessions' && (
          <div className="border-2 border-black rounded-xl shadow-brutal overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand text-white border-b-2 border-black">
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">Aula</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden md:table-cell">Data/Hora</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden lg:table-cell">Empresa</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">Status</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden sm:table-cell">Alunos</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const config = STATUS_CONFIG[session.status];
                    const StatusIcon = config.icon;
                    return (
                      <tr key={session.id} className="border-b-2 border-black last:border-none hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-sm">{session.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{session.courseName} • {session.durationMinutes}min</p>
                        </td>
                        <td className="p-4 text-sm text-gray-600 hidden md:table-cell whitespace-nowrap">
                          {new Date(session.scheduledAt).toLocaleDateString('pt-BR')} às {new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-sm hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs bg-gray-100 px-2 py-1 rounded border border-black">
                            <Building2 size={12} /> {session.companyCode}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase border-2 rounded-lg ${config.color}`}>
                            <StatusIcon size={12} /> {config.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold hidden sm:table-cell">
                          {session.participants > 0 ? (
                            <span className="flex items-center gap-1"><Users size={14} /> {session.participants}</span>
                          ) : '—'}
                        </td>
                        <td className="p-4 text-right">
                          {session.status === 'scheduled' && (
                            <Button variant="primary" size="sm" className="!py-1.5 !px-3 !text-xs" onClick={() => handleStatusChange(session.id, 'live')}>
                              Liberar Acesso
                            </Button>
                          )}
                          {session.status === 'live' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                className="!py-1.5 !px-3 !text-xs bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => navigate(`/live/${session.id}`, {
                                  state: { participantName: user?.name || 'Admin', jitsiRoom: `caseg-${session.id}` },
                                })}
                              >
                                <LogIn size={12} className="mr-1" />
                                Entrar
                              </Button>
                              <Button variant="danger" size="sm" className="!py-1.5 !px-3 !text-xs" onClick={() => handleStatusChange(session.id, 'completed')}>
                                Encerrar
                              </Button>
                              <Button variant="secondary" size="sm" className="!py-1.5 !px-3 !text-xs" onClick={() => navigate(`/admin/live-sessions/${session.id}/analytics`)}>
                                <BarChart3 size={12} className="mr-1" />
                                Relatório
                              </Button>
                            </div>
                          )}
                          {session.status === 'completed' && (
                            <Button variant="secondary" size="sm" className="!py-1.5 !px-3 !text-xs" onClick={() => navigate(`/admin/live-sessions/${session.id}/analytics`)}>
                              <BarChart3 size={12} className="mr-1" />
                              Relatório
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Certificates */}
        {activeTab === 'certificates' && (
          <>
            {/* Bulk Download Bar */}
            <div className="flex items-center justify-between mb-4 p-4 bg-emerald-50 border-2 border-black rounded-xl shadow-brutal-sm">
              <div className="flex items-center gap-3">
                <div className="bg-brand text-white p-2 rounded-lg border-2 border-black">
                  <Award size={20} />
                </div>
                <div>
                  <p className="font-display font-bold text-sm uppercase tracking-wide">Certificados da Turma</p>
                  <p className="text-xs text-gray-600">Emita os aprovados de uma vez e baixe todos em um único ZIP</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  onClick={issueAllEligible}
                  disabled={issuingAll || pendingCount === 0}
                  className="gap-2 !py-2.5"
                >
                  <Award size={18} />
                  {issuingAll ? 'Emitindo…' : `Emitir Aprovados (${pendingCount})`}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkDownload}
                  disabled={downloadingZip || certificates.length === 0}
                  className="gap-2 !py-2.5"
                >
                  <Download size={18} />
                  {downloadingZip ? 'Gerando ZIP...' : `Baixar Todos (${certificates.length})`}
                </Button>
              </div>
            </div>

            <div className="border-2 border-black rounded-xl shadow-brutal overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand text-white border-b-2 border-black">
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">Participante</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden sm:table-cell">Empresa</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden lg:table-cell">Aula</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">Certificado</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {participantsSorted.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum participante registrado ainda. Os alunos aparecem aqui depois de entrarem em uma aula.</td></tr>
                  )}
                  {participantsSorted.map((p) => {
                    const key = `${p.sessionId}:${p.employeeName}`;
                    const issuing = issuingKey === key;
                    return (
                      <tr key={p.id} className="border-b-2 border-black last:border-none hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${p.certificateIssued ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                              <Award size={14} />
                            </div>
                            <span className="font-bold text-sm">{p.employeeName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm hidden sm:table-cell">
                          <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-1 rounded border border-black">
                            {p.companyCode}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600 hidden lg:table-cell">
                          {sessionTitle(p.sessionId)}
                        </td>
                        <td className="p-4">
                          {p.certificateIssued ? (
                            <span className="inline-flex items-center gap-1 rounded-md border-2 border-brand bg-emerald-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                              <CheckCircle2 size={12} strokeWidth={2.5} /> Emitido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border-2 border-gray-400 bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {p.certificateIssued ? (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {p.completedAt ? new Date(p.completedAt).toLocaleDateString('pt-BR') : 'OK'}
                            </span>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="!py-1.5 !px-3 !text-xs gap-1"
                              disabled={issuing}
                              onClick={() => issueCertificate(p)}
                            >
                              <Award size={12} /> {issuing ? 'Emitindo…' : 'Emitir certificado'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {/* Modal Criar Aula (simples) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="max-w-lg w-full !p-0 overflow-hidden">
              <div className="bg-brand px-6 py-4 border-b-2 border-black flex items-center justify-between">
                <h2 className="font-display font-bold text-white text-lg uppercase tracking-wide">Nova Aula Ao Vivo</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-white hover:opacity-70">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <Input label="Título da Aula" placeholder="Ex: NR-35 Reciclagem Turma B" value={createForm.title} onChange={(e: any) => setCreateForm(f => ({ ...f, title: e.target.value }))} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Data" type="date" value={createForm.date} onChange={(e: any) => setCreateForm(f => ({ ...f, date: e.target.value }))} />
                  <Input label="Horário" type="time" value={createForm.time} onChange={(e: any) => setCreateForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Duração (min)" placeholder="60" value={createForm.duration} onChange={(e: any) => setCreateForm(f => ({ ...f, duration: e.target.value }))} />
                  <Input label="Código da Empresa" placeholder="Ex: ALFA01" className="uppercase" value={createForm.companyCode} onChange={(e: any) => setCreateForm(f => ({ ...f, companyCode: e.target.value }))} />
                </div>
                <Input label="Curso Vinculado" placeholder="Selecione ou digite o curso" value={createForm.courseName} onChange={(e: any) => setCreateForm(f => ({ ...f, courseName: e.target.value }))} />

                {/* Conformidade NR — vão para o certificado */}
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/70 p-4 space-y-3">
                  <p className="text-xs font-display font-bold uppercase tracking-wide text-gray-600 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Conformidade NR (vai no certificado)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Norma (NR)" placeholder="Ex: NR-35" value={createForm.nrReference} onChange={(e: any) => setCreateForm(f => ({ ...f, nrReference: e.target.value }))} />
                    <Input label="Validade (meses)" placeholder="0 = sem validade" value={createForm.validityMonths} onChange={(e: any) => setCreateForm(f => ({ ...f, validityMonths: e.target.value }))} />
                  </div>
                  <Input label="Instrutor responsável" placeholder="Nome do instrutor" value={createForm.instructorName} onChange={(e: any) => setCreateForm(f => ({ ...f, instructorName: e.target.value }))} />
                  <Input label="Qualificação do instrutor" placeholder="Ex: Eng. Seg. Trabalho — CREA 000000" value={createForm.instructorTitle} onChange={(e: any) => setCreateForm(f => ({ ...f, instructorTitle: e.target.value }))} />
                </div>
              </div>
              <div className="px-6 py-4 border-t-2 border-black bg-gray-50 flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleCreate}>Criar Aula</Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
