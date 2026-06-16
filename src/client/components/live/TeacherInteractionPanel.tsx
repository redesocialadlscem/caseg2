import { useCallback, useEffect, useState } from 'react';
import { Zap, Plus, Play, Square, Trash2, Users, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface BankItem { id: number; type: string; question: string; options: string[]; }
interface SessionItem {
  id: number;
  interactionId: number;
  status: 'pending' | 'open' | 'closed';
  type: string;
  question: string;
  options: string[];
  responseCount: number;
}
interface Stats {
  total: number;
  counts: number[];
  textCounts?: { answer: string; count: number }[];
  correctAnswer: number | null;
  correctCount?: number;
  accuracy: number;
  avgResponseMs: number;
}

interface Props {
  sessionId: number;
  accessToken: string | null;
}

/** Painel do PROFESSOR: anexa interações do banco, libera/encerra e vê estatística ao vivo. */
export function TeacherInteractionPanel({ sessionId, accessToken }: Props) {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [bank, setBank] = useState<BankItem[]>([]);
  const [showBank, setShowBank] = useState(false);
  const [stats, setStats] = useState<Record<number, Stats>>({});

  const loadItems = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/admin/live-sessions/${sessionId}/interactions`, accessToken);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch { /* ignore */ }
  }, [sessionId, accessToken]);

  const loadBank = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/interactions', accessToken);
      const data = await res.json();
      setBank(data.interactions ?? []);
    } catch { /* ignore */ }
  }, [accessToken]);

  useEffect(() => { loadItems(); loadBank(); }, [loadItems, loadBank]);

  // Poll da lista a cada 3s
  useEffect(() => {
    const id = setInterval(loadItems, 3000);
    return () => clearInterval(id);
  }, [loadItems]);

  // Poll das stats da interação aberta a cada 2s
  const openItem = items.find((i) => i.status === 'open');
  useEffect(() => {
    if (!openItem) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await apiFetch(`/api/admin/session-interactions/${openItem!.id}/stats`, accessToken);
        const data = await res.json();
        if (!cancelled) setStats((s) => ({ ...s, [openItem!.id]: data }));
      } catch { /* ignore */ }
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [openItem, accessToken]);

  async function attach(interactionId: number) {
    try {
      await apiFetch(`/api/admin/live-sessions/${sessionId}/interactions`, accessToken, {
        method: 'POST', body: JSON.stringify({ interactionId }),
      });
      setShowBank(false);
      loadItems();
    } catch { /* ignore */ }
  }
  async function open(siId: number) {
    try { await apiFetch(`/api/admin/session-interactions/${siId}/open`, accessToken, { method: 'POST' }); loadItems(); } catch { /* ignore */ }
  }
  async function close(siId: number) {
    try { await apiFetch(`/api/admin/session-interactions/${siId}/close`, accessToken, { method: 'POST' }); loadItems(); } catch { /* ignore */ }
  }
  async function remove(siId: number) {
    try { await apiFetch(`/api/admin/session-interactions/${siId}`, accessToken, { method: 'DELETE' }); loadItems(); } catch { /* ignore */ }
  }

  const attachedIds = new Set(items.map((i) => i.interactionId));

  return (
    <div className="p-5 border-b-2 border-black">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-display font-bold uppercase tracking-wide text-brand flex items-center gap-1.5">
          <Zap size={14} strokeWidth={2.5} /> Interações (Instrutor)
        </p>
        <button
          onClick={() => { setShowBank((v) => !v); loadBank(); }}
          className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-brand px-2 py-1 text-xs font-bold uppercase text-white shadow-brutal-sm hover:bg-brand-light"
        >
          <Plus size={13} strokeWidth={3} /> Banco
        </button>
      </div>

      {/* Seletor do banco */}
      {showBank && (
        <div className="mb-3 max-h-44 overflow-y-auto rounded-xl border-2 border-black bg-white p-2 space-y-1">
          {bank.length === 0 && <p className="text-xs text-gray-500 p-2">Nenhuma interação no banco. Crie em Admin → Banco de Interações.</p>}
          {bank.map((b) => (
            <button
              key={b.id}
              onClick={() => attach(b.id)}
              disabled={attachedIds.has(b.id)}
              className="w-full text-left rounded-lg border-2 border-black px-2 py-1.5 text-xs hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-default"
            >
              <span className="font-bold uppercase text-[10px] text-gray-500">{b.type}</span> · {b.question.slice(0, 50)}
            </button>
          ))}
        </div>
      )}

      {/* Lista de interações da sessão */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma interação nesta aula. Clique em "Banco" para adicionar.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const st = stats[it.id];
            return (
              <div key={it.id} className={`rounded-xl border-2 border-black p-3 ${it.status === 'open' ? 'bg-emerald-50' : 'bg-white'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display font-bold text-sm leading-snug flex-1">{it.question}</p>
                  {it.status === 'open' && <span className="shrink-0 rounded-md border-2 border-black bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">No ar</span>}
                  {it.status === 'closed' && <span className="shrink-0 rounded-md border-2 border-black bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold uppercase">Encerrada</span>}
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Users size={13} /> {it.responseCount} resposta{it.responseCount === 1 ? '' : 's'}
                </div>

                {/* Stats ao vivo da interação aberta */}
                {it.status === 'open' && st && (
                  <div className="mt-2 space-y-1">
                    {it.type === 'flash' ? (
                      /* Presença relâmpago — contagem de confirmações */
                      <p className="text-sm font-display font-bold text-brand flex items-center gap-1.5">
                        <CheckCircle2 size={15} strokeWidth={2.5} /> {st.total} presente{st.total === 1 ? '' : 's'} confirmado{st.total === 1 ? '' : 's'}
                      </p>
                    ) : it.type === 'keyword' ? (
                      /* Palavra-chave — distribuição das respostas digitadas */
                      <>
                        {(st.textCounts ?? []).length === 0 && <p className="text-xs text-gray-500">Aguardando respostas…</p>}
                        {(st.textCounts ?? []).slice(0, 8).map((t, i) => {
                          const pct = st.total ? Math.round((t.count / st.total) * 100) : 0;
                          return (
                            <div key={i} className="text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-700 truncate pr-2">{t.answer}</span>
                                <span className="font-bold shrink-0">{t.count} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 border border-black rounded-full overflow-hidden">
                                <div className="h-full bg-gray-400" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-[11px] font-bold text-gray-500 pt-1">Acerto: {st.accuracy}% · Tempo médio: {(st.avgResponseMs / 1000).toFixed(1)}s</p>
                      </>
                    ) : (
                      /* Quiz / V-F / Enquete — barras por alternativa */
                      <>
                        {it.options.map((o, i) => {
                          const c = st.counts[i] ?? 0;
                          const pct = st.total ? Math.round((c / st.total) * 100) : 0;
                          const isCorrect = st.correctAnswer === i;
                          return (
                            <div key={i} className="text-xs">
                              <div className="flex justify-between">
                                <span className={isCorrect ? 'font-bold text-brand flex items-center gap-1' : 'text-gray-600'}>
                                  {isCorrect && <CheckCircle2 size={11} strokeWidth={3} />} {o}
                                </span>
                                <span className="font-bold">{c} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 border border-black rounded-full overflow-hidden">
                                <div className={`h-full ${isCorrect ? 'bg-brand' : 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {st.correctAnswer !== null && (
                          <p className="text-[11px] font-bold text-gray-500 pt-1">Acerto: {st.accuracy}% · Tempo médio: {(st.avgResponseMs / 1000).toFixed(1)}s</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div className="mt-2 flex gap-2">
                  {it.status !== 'open' ? (
                    <button onClick={() => open(it.id)} className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-brand px-2.5 py-1 text-xs font-bold uppercase text-white shadow-brutal-sm hover:bg-brand-light">
                      <Play size={12} strokeWidth={3} /> Liberar
                    </button>
                  ) : (
                    <button onClick={() => close(it.id)} className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-black px-2.5 py-1 text-xs font-bold uppercase text-white shadow-brutal-sm hover:bg-gray-800">
                      <Square size={12} strokeWidth={3} /> Encerrar
                    </button>
                  )}
                  {it.status !== 'open' && (
                    <button onClick={() => remove(it.id)} className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-white px-2 py-1 text-xs font-bold text-gray-500 hover:text-red-600 shadow-brutal-sm" title="Remover">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
