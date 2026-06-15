import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { apiFetch } from '../../lib/api';
import { useAuthContext } from '../../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LessonConfig {
  hasActivity: boolean;
  hasExam: boolean;
  examDurationMinutes: number;
  examPassingScore: number;
  activityDurationMinutes: number;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  orderIndex: number;
}

interface EvaluationsData {
  config: LessonConfig | null;
  examQuestions: Question[];
  activities: Question[];
}

const DEFAULT_CONFIG: LessonConfig = {
  hasActivity: false,
  hasExam: false,
  examDurationMinutes: 30,
  examPassingScore: 70,
  activityDurationMinutes: 15,
};

// ─── Component ───────────────────────────────────────────────────────────────
export function AdminLessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<LessonConfig>(DEFAULT_CONFIG);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [activities, setActivities] = useState<Question[]>([]);

  // Feedback state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New question form state (shared for both exam and activity)
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [addingType, setAddingType] = useState<'exam' | 'activity'>('exam');
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch Data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!lessonId || !accessToken) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/lessons/${lessonId}/evaluations`, accessToken);
      const data: EvaluationsData = await res.json();
      if (data.config) setConfig(data.config);
      setExamQuestions(data.examQuestions);
      setActivities(data.activities);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [lessonId, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clear messages after 3s
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // ─── Save Config ─────────────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    if (!lessonId || !accessToken) return;
    try {
      setSubmitting(true);
      await apiFetch(`/api/admin/lessons/${lessonId}/config`, accessToken, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setSuccessMsg('Configuração salva com sucesso!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar configuração');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Add Question ────────────────────────────────────────────────────────
  const handleAddQuestion = async () => {
    if (!lessonId || !accessToken) return;
    if (!newQuestion.trim()) {
      setErrorMsg('O enunciado é obrigatório');
      return;
    }
    if (newOptions.some((o) => !o.trim())) {
      setErrorMsg('Todas as opções devem ser preenchidas');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint =
        addingType === 'exam'
          ? `/api/admin/lessons/${lessonId}/exam-questions`
          : `/api/admin/lessons/${lessonId}/activities`;

      await apiFetch(endpoint, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          question: newQuestion,
          options: newOptions,
          correctAnswer,
        }),
      });

      // Reset form
      setNewQuestion('');
      setNewOptions(['', '', '', '']);
      setCorrectAnswer(0);
      setSuccessMsg(
        addingType === 'exam' ? 'Questão de prova adicionada!' : 'Atividade adicionada!',
      );

      // Refresh list
      await fetchData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao adicionar questão');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Question ─────────────────────────────────────────────────────
  const handleDelete = async (id: number, type: 'exam' | 'activity') => {
    if (!accessToken) return;
    try {
      const endpoint =
        type === 'exam'
          ? `/api/admin/exam-questions/${id}`
          : `/api/admin/activities/${id}`;

      await apiFetch(endpoint, accessToken, { method: 'DELETE' });
      setSuccessMsg('Item removido com sucesso!');
      await fetchData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao remover item');
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand animate-spin" strokeWidth={2.5} />
        </main>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/admin/courses')}
              className="w-10 h-10 border-2 border-black rounded-xl shadow-brutal-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="font-display font-bold text-2xl uppercase tracking-wide">
                Editor de Aula #{lessonId}
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
                Configure avaliações e atividades
              </p>
            </div>
          </div>

          {/* Toast Messages */}
          {successMsg && (
            <div className="flex items-center gap-3 p-4 border-2 border-black rounded-xl shadow-brutal-sm bg-emerald-50">
              <CheckCircle2 className="w-5 h-5 text-brand shrink-0" strokeWidth={2.5} />
              <p className="font-body text-sm font-medium text-brand">{successMsg}</p>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 border-2 border-black rounded-xl shadow-brutal-sm bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" strokeWidth={2.5} />
              <p className="font-body text-sm font-medium text-red-600">{errorMsg}</p>
            </div>
          )}

          {/* ─── Section 1: Config ─────────────────────────────────────────── */}
          <section className="border-2 border-black rounded-xl shadow-brutal p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border-2 border-black rounded-lg shadow-brutal-sm bg-brand flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="font-display font-bold text-lg uppercase tracking-wide">
                Configuração da Aula
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={config.hasActivity}
                  onChange={(e) => setConfig({ ...config, hasActivity: e.target.checked })}
                  className="w-5 h-5 accent-brand"
                />
                <span className="font-body font-medium text-sm group-hover:text-brand transition-colors">
                  Tem Atividade?
                </span>
              </label>

              {/* Exam Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={config.hasExam}
                  onChange={(e) => setConfig({ ...config, hasExam: e.target.checked })}
                  className="w-5 h-5 accent-brand"
                />
                <span className="font-body font-medium text-sm group-hover:text-brand transition-colors">
                  Tem Prova?
                </span>
              </label>
            </div>

            {/* Conditional Fields */}
            {(config.hasActivity || config.hasExam) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-dashed border-gray-200">
                {config.hasActivity && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Duração Atividade (min)
                    </label>
                    <Input
                      type="number"
                      value={config.activityDurationMinutes}
                      onChange={(e) =>
                        setConfig({ ...config, activityDurationMinutes: Number(e.target.value) || 15 })
                      }
                      className="w-full"
                    />
                  </div>
                )}
                {config.hasExam && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        Duração Prova (min)
                      </label>
                      <Input
                        type="number"
                        value={config.examDurationMinutes}
                        onChange={(e) =>
                          setConfig({ ...config, examDurationMinutes: Number(e.target.value) || 30 })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        Nota Mínima (%)
                      </label>
                      <Input
                        type="number"
                        value={config.examPassingScore}
                        onChange={(e) =>
                          setConfig({ ...config, examPassingScore: Number(e.target.value) || 70 })
                        }
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pt-4">
              <Button
                variant="primary"
                onClick={handleSaveConfig}
                disabled={submitting}
                className="gap-2 min-w-[180px]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configuração
              </Button>
            </div>
          </section>

          {/* ─── Section 2: Exam Questions ─────────────────────────────────── */}
          {config.hasExam && (
            <section className="border-2 border-black rounded-xl shadow-brutal p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border-2 border-black rounded-lg shadow-brutal-sm bg-brand flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="font-display font-bold text-lg uppercase tracking-wide">
                  Questões de Prova ({examQuestions.length})
                </h2>
              </div>

              {/* Existing Questions List */}
              {examQuestions.length > 0 && (
                <div className="space-y-3">
                  {examQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="border-2 border-black rounded-xl p-4 bg-gray-50 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium mb-2">
                          <span className="font-bold text-brand mr-2">{idx + 1}.</span>
                          {q.question}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className={`text-xs px-2 py-1 rounded border ${
                                oIdx === q.correctAnswer
                                  ? 'bg-brand text-white border-brand'
                                  : 'bg-white border-gray-300 text-gray-600'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(q.id, 'exam')}
                        className="shrink-0 w-8 h-8 border-2 border-black rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Question Form */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 space-y-4">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-gray-500">
                  Nova Questão de Prova
                </h3>
                <textarea
                  placeholder="Enunciado da questão..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full p-3 border-2 border-black rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                  rows={2}
                />
                <div className="space-y-2">
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctExam"
                        checked={correctAnswer === idx}
                        onChange={() => setCorrectAnswer(idx)}
                        className="accent-brand"
                      />
                      <input
                        type="text"
                        placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => {
                          const next = [...newOptions];
                          next[idx] = e.target.value;
                          setNewOptions(next);
                        }}
                        className="flex-1 p-2 border-2 border-black rounded-lg font-body text-sm focus:outline-none focus:border-brand"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddingType('exam');
                    handleAddQuestion();
                  }}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar Questão
                </Button>
              </div>
            </section>
          )}

          {/* ─── Section 3: Activities ─────────────────────────────────────── */}
          {config.hasActivity && (
            <section className="border-2 border-black rounded-xl shadow-brutal p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border-2 border-black rounded-lg shadow-brutal-sm bg-brand flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="font-display font-bold text-lg uppercase tracking-wide">
                  Atividades ({activities.length})
                </h2>
              </div>

              {/* Existing Activities List */}
              {activities.length > 0 && (
                <div className="space-y-3">
                  {activities.map((a, idx) => (
                    <div
                      key={a.id}
                      className="border-2 border-black rounded-xl p-4 bg-gray-50 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium mb-2">
                          <span className="font-bold text-brand mr-2">{idx + 1}.</span>
                          {a.question}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {a.options.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className={`text-xs px-2 py-1 rounded border ${
                                oIdx === a.correctAnswer
                                  ? 'bg-brand text-white border-brand'
                                  : 'bg-white border-gray-300 text-gray-600'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(a.id, 'activity')}
                        className="shrink-0 w-8 h-8 border-2 border-black rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Activity Form */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 space-y-4">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-gray-500">
                  Nova Atividade
                </h3>
                <textarea
                  placeholder="Enunciado da atividade..."
                  value={addingType === 'activity' ? newQuestion : ''}
                  onChange={(e) => {
                    setAddingType('activity');
                    setNewQuestion(e.target.value);
                  }}
                  className="w-full p-3 border-2 border-black rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                  rows={2}
                />
                <div className="space-y-2">
                  {(addingType === 'activity' ? newOptions : ['', '', '', '']).map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctActivity"
                        checked={addingType === 'activity' && correctAnswer === idx}
                        onChange={() => {
                          setAddingType('activity');
                          setCorrectAnswer(idx);
                        }}
                        className="accent-brand"
                      />
                      <input
                        type="text"
                        placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => {
                          setAddingType('activity');
                          const next = [...newOptions];
                          next[idx] = e.target.value;
                          setNewOptions(next);
                        }}
                        className="flex-1 p-2 border-2 border-black rounded-lg font-body text-sm focus:outline-none focus:border-brand"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddingType('activity');
                    handleAddQuestion();
                  }}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar Atividade
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
