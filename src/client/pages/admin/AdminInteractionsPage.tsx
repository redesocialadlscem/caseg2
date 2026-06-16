import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Plus, Pencil, Trash2, Copy, ChevronRight, ArrowRight,
  X, Loader2, AlertCircle, CheckCircle2, Clock, ListChecks, ToggleLeft, BarChart3,
  Type, Hand,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { apiFetch } from '../../lib/api';
import { useAuthContext } from '../../context/AuthContext';

type InteractionType = 'quiz' | 'truefalse' | 'poll' | 'keyword' | 'flash';

interface Interaction {
  id: number;
  type: InteractionType;
  question: string;
  options: string[];
  correctAnswer: number | null;
  correctText?: string[];
  timeLimitSeconds: number;
  category: string;
}

const TYPE_META: Record<InteractionType, { label: string; icon: typeof Zap; hint: string }> = {
  quiz: { label: 'Quiz', icon: ListChecks, hint: 'Múltipla escolha com 1 resposta correta' },
  truefalse: { label: 'Verdadeiro / Falso', icon: ToggleLeft, hint: 'Afirmação binária' },
  poll: { label: 'Enquete', icon: BarChart3, hint: 'Sem resposta certa — só opinião' },
  keyword: { label: 'Palavra-chave', icon: Type, hint: 'Resposta digitada (completar frase / palavra-chave)' },
  flash: { label: 'Presença', icon: Hand, hint: 'Presença relâmpago — o aluno toca para confirmar' },
};

/** Tipos cujo conteúdo é baseado em alternativas. */
const OPTION_TYPES: InteractionType[] = ['quiz', 'truefalse', 'poll'];

interface FormState {
  type: InteractionType;
  question: string;
  options: string[];
  correctAnswer: number;
  correctText: string[]; // respostas aceitas (keyword)
  timeLimitSeconds: number;
  category: string;
}

const EMPTY_FORM: FormState = {
  type: 'quiz',
  question: '',
  options: ['', ''],
  correctAnswer: 0,
  correctText: [''],
  timeLimitSeconds: 20,
  category: '',
};

export function AdminInteractionsPage() {
  const { accessToken } = useAuthContext();

  const [items, setItems] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'' | InteractionType>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = filterType ? `?type=${filterType}` : '';
      const res = await apiFetch(`/api/admin/interactions${qs}`, accessToken);
      const data = await res.json();
      setItems(data.interactions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar interações');
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterType]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ─── Form helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (it: Interaction) => {
    setEditingId(it.id);
    setForm({
      type: it.type,
      question: it.question,
      options: it.type === 'truefalse' ? ['Verdadeiro', 'Falso'] : (it.options.length ? [...it.options] : ['', '']),
      correctAnswer: it.correctAnswer ?? 0,
      correctText: it.correctText && it.correctText.length ? [...it.correctText] : [''],
      timeLimitSeconds: it.timeLimitSeconds,
      category: it.category,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const changeType = (type: InteractionType) => {
    setForm((f) => {
      if (type === 'truefalse') {
        return { ...f, type, options: ['Verdadeiro', 'Falso'], correctAnswer: Math.min(f.correctAnswer, 1) };
      }
      if (type === 'keyword') {
        return { ...f, type, correctText: f.correctText.length ? f.correctText : [''] };
      }
      if (type === 'flash') {
        return { ...f, type };
      }
      // quiz/poll: garante ao menos 2 opções
      const options = f.options.length >= 2 ? f.options : ['', ''];
      return { ...f, type, options };
    });
  };

  const setAccepted = (idx: number, value: string) =>
    setForm((f) => ({ ...f, correctText: f.correctText.map((a, i) => (i === idx ? value : a)) }));
  const addAccepted = () => setForm((f) => (f.correctText.length < 20 ? { ...f, correctText: [...f.correctText, ''] } : f));
  const removeAccepted = (idx: number) =>
    setForm((f) => (f.correctText.length <= 1 ? f : { ...f, correctText: f.correctText.filter((_, i) => i !== idx) }));

  const setOption = (idx: number, value: string) => {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? value : o)) }));
  };
  const addOption = () => setForm((f) => (f.options.length < 8 ? { ...f, options: [...f.options, ''] } : f));
  const removeOption = (idx: number) =>
    setForm((f) => {
      if (f.options.length <= 2) return f;
      const options = f.options.filter((_, i) => i !== idx);
      const correctAnswer = f.correctAnswer >= options.length ? options.length - 1 : f.correctAnswer;
      return { ...f, options, correctAnswer };
    });

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.question.trim()) return setFormError('A pergunta é obrigatória.');

    const isOptionType = OPTION_TYPES.includes(form.type);
    let opts: string[] = [];
    let accepted: string[] = [];

    if (isOptionType) {
      opts = form.options.map((o) => o.trim());
      if (opts.some((o) => !o)) return setFormError('Preencha todas as alternativas (ou remova as vazias).');
      if (opts.length < 2) return setFormError('Mínimo de 2 alternativas.');
    } else if (form.type === 'keyword') {
      accepted = form.correctText.map((a) => a.trim()).filter(Boolean);
      if (accepted.length === 0) return setFormError('Informe ao menos uma resposta aceita.');
    }

    const payload = {
      type: form.type,
      question: form.question.trim(),
      options: opts,
      correctAnswer: (form.type === 'quiz' || form.type === 'truefalse') ? form.correctAnswer : null,
      correctText: accepted,
      timeLimitSeconds: form.timeLimitSeconds,
      category: form.category.trim(),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await apiFetch(`/api/admin/interactions/${editingId}`, accessToken, { method: 'PUT', body: JSON.stringify(payload) });
        setSuccessMsg('Interação atualizada!');
      } else {
        await apiFetch('/api/admin/interactions', accessToken, { method: 'POST', body: JSON.stringify(payload) });
        setSuccessMsg('Interação criada!');
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async (it: Interaction) => {
    try {
      await apiFetch(`/api/admin/interactions/${it.id}/duplicate`, accessToken, { method: 'POST' });
      setSuccessMsg('Interação duplicada!');
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao duplicar');
    }
  };

  const handleDelete = async (it: Interaction) => {
    if (!window.confirm(`Deletar a interação "${it.question.slice(0, 40)}…"?`)) return;
    try {
      await apiFetch(`/api/admin/interactions/${it.id}`, accessToken, { method: 'DELETE' });
      setSuccessMsg('Interação deletada!');
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao deletar');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  const TabBtn = ({ value, label }: { value: '' | InteractionType; label: string }) => (
    <button
      onClick={() => setFilterType(value)}
      className={`rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-brutal-sm transition-colors ${
        filterType === value ? 'bg-brand text-white' : 'bg-white text-black hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
              <Link to="/admin" className="hover:text-black transition-colors">Admin</Link>
              <ChevronRight size={14} />
              <span className="text-black">Banco de Interações</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl flex items-center gap-3">
              <Zap className="text-brand" size={36} />
              Banco de Interações
            </h1>
            <p className="font-body text-sm text-gray-600 mt-2">
              Crie quizzes, V/F, enquetes, palavra-chave e presença relâmpago para disparar durante a aula ao vivo.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/live-sessions">
              <Button variant="outline" size="sm" className="gap-2">Aulas ao Vivo <ArrowRight size={16} /></Button>
            </Link>
            <Button onClick={openCreate} size="sm" className="gap-2">
              <Plus size={18} strokeWidth={3} /> Nova Interação
            </Button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 rounded-xl shadow-brutal-sm flex items-center gap-3">
            <AlertCircle className="text-red-600 shrink-0" size={20} />
            <p className="text-sm font-bold text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800"><X size={16} /></button>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border-2 border-brand rounded-xl shadow-brutal-sm flex items-center gap-3">
            <CheckCircle2 className="text-brand shrink-0" size={20} />
            <p className="text-sm font-bold text-brand">{successMsg}</p>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          <TabBtn value="" label="Todas" />
          <TabBtn value="quiz" label="Quiz" />
          <TabBtn value="truefalse" label="V / F" />
          <TabBtn value="poll" label="Enquete" />
          <TabBtn value="keyword" label="Palavra-chave" />
          <TabBtn value="flash" label="Presença" />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-black rounded-xl p-6 bg-white shadow-brutal animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="text-center py-16">
            <Zap className="mx-auto text-gray-300 mb-4" size={48} strokeWidth={1.5} />
            <h3 className="font-display font-bold text-xl mb-2">Nenhuma interação ainda</h3>
            <p className="text-gray-500 mb-6">Crie a primeira para usar nas suas aulas ao vivo.</p>
            <Button onClick={openCreate} className="gap-2"><Plus size={18} strokeWidth={3} /> Criar Primeira</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((it) => {
              const Meta = TYPE_META[it.type];
              return (
                <Card key={it.id} className="!p-0 overflow-hidden">
                  <div className="p-5 flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-brutal-sm">
                        <Meta.icon size={14} strokeWidth={2.5} /> {Meta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500">
                        <Clock size={13} /> {it.timeLimitSeconds}s
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base leading-tight">{it.question}</h3>
                    {it.type === 'flash' ? (
                      <p className="text-sm text-gray-500 flex items-center gap-2"><Hand size={14} strokeWidth={2.5} /> Toque para confirmar presença</p>
                    ) : it.type === 'keyword' ? (
                      <ul className="space-y-1">
                        {(it.correctText ?? []).map((a, i) => (
                          <li key={i} className="text-sm flex items-center gap-2 font-bold text-brand">
                            <CheckCircle2 size={14} strokeWidth={2.5} /> {a}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="space-y-1">
                        {it.options.map((o, i) => (
                          <li key={i} className={`text-sm flex items-center gap-2 ${it.correctAnswer === i ? 'font-bold text-brand' : 'text-gray-600'}`}>
                            {it.correctAnswer === i ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <span className="inline-block w-3.5" />}
                            {o}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t-2 border-dashed border-gray-200">
                      {it.category ? (
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{it.category}</span>
                      ) : <span />}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDuplicate(it)} title="Duplicar"><Copy size={15} /></Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(it)} title="Editar"><Pencil size={15} /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(it)} title="Deletar"><Trash2 size={15} /></Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal criar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border-2 border-black rounded-xl shadow-brutal p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl">{editingId ? 'Editar Interação' : 'Nova Interação'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-5">
              {/* Tipo */}
              <div>
                <label className="font-display font-bold text-xs uppercase tracking-wide mb-2 block">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(TYPE_META) as InteractionType[]).map((t) => {
                    const M = TYPE_META[t];
                    return (
                      <button
                        key={t}
                        onClick={() => changeType(t)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 border-black p-3 text-xs font-bold uppercase shadow-brutal-sm transition-colors ${
                          form.type === t ? 'bg-brand text-white' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <M.icon size={20} strokeWidth={2.5} />
                        {M.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{TYPE_META[form.type].hint}</p>
              </div>

              {/* Pergunta */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-xs uppercase tracking-wide mb-1 block">Pergunta</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Qual o primeiro procedimento ao identificar um princípio de incêndio?"
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-body text-base placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand resize-none"
                  autoFocus
                />
              </div>

              {/* Alternativas (quiz / V-F / enquete) */}
              {OPTION_TYPES.includes(form.type) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-display font-bold text-xs uppercase tracking-wide block">
                      Alternativas {form.type !== 'poll' && <span className="text-brand">(marque a correta)</span>}
                    </label>
                    {form.type !== 'truefalse' && form.options.length < 8 && (
                      <button onClick={addOption} className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                        <Plus size={13} /> Adicionar
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {form.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {form.type !== 'poll' && (
                          <button
                            onClick={() => setForm((f) => ({ ...f, correctAnswer: idx }))}
                            title="Marcar como correta"
                            className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black transition-colors ${
                              form.correctAnswer === idx ? 'bg-brand text-white' : 'bg-white text-transparent hover:bg-gray-100'
                            }`}
                          >
                            <CheckCircle2 size={16} strokeWidth={2.5} />
                          </button>
                        )}
                        <input
                          value={opt}
                          disabled={form.type === 'truefalse'}
                          onChange={(e) => setOption(idx, e.target.value)}
                          placeholder={`Alternativa ${idx + 1}`}
                          className="flex-1 bg-white border-2 border-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:bg-gray-100"
                        />
                        {form.type !== 'truefalse' && form.options.length > 2 && (
                          <button onClick={() => removeOption(idx)} className="shrink-0 text-gray-400 hover:text-red-600" title="Remover">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Respostas aceitas (keyword) */}
              {form.type === 'keyword' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-display font-bold text-xs uppercase tracking-wide block">
                      Respostas aceitas <span className="text-brand">(qualquer uma vale)</span>
                    </label>
                    {form.correctText.length < 20 && (
                      <button onClick={addAccepted} className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                        <Plus size={13} /> Adicionar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">A comparação ignora maiúsculas, acentos e pontuação.</p>
                  <div className="space-y-2">
                    {form.correctText.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          value={a}
                          onChange={(e) => setAccepted(idx, e.target.value)}
                          placeholder={`Resposta ${idx + 1}`}
                          className="flex-1 bg-white border-2 border-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-brand/30"
                        />
                        {form.correctText.length > 1 && (
                          <button onClick={() => removeAccepted(idx)} className="shrink-0 text-gray-400 hover:text-red-600" title="Remover">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Presença relâmpago — sem campos extras */}
              {form.type === 'flash' && (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 flex items-center gap-2">
                  <Hand size={18} strokeWidth={2.5} className="text-brand shrink-0" />
                  Ao liberar, o aluno verá um botão para confirmar presença dentro do tempo definido.
                </div>
              )}

              {/* Tempo + Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-display font-bold text-xs uppercase tracking-wide mb-1 block">Tempo (s)</label>
                  <input
                    type="number" min={5} max={600}
                    value={form.timeLimitSeconds}
                    onChange={(e) => setForm((f) => ({ ...f, timeLimitSeconds: Number(e.target.value) || 20 }))}
                    className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-brand/30"
                  />
                </div>
                <Input
                  label="Categoria (opcional)"
                  placeholder="Ex: Brigada"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>

              {formError && <p className="text-sm font-bold text-red-600">{formError}</p>}
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1" disabled={submitting}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2">
                {submitting ? (<><Loader2 className="animate-spin" size={18} /> Salvando...</>) : editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
