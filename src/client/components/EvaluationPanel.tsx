import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  RotateCcw,
  ArrowRight,
  ClipboardCheck,
  FileCheck,
} from 'lucide-react';
import { Button } from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationConfig {
  hasActivity: boolean;
  hasExam: boolean;
  examDurationMinutes: number;
  examPassingScore: number;
  activityDurationMinutes: number;
}

interface QuestionItem {
  id: number;
  question: string;
  options: string[];
  orderIndex: number;
}

interface ActivityDetail {
  activityId: number;
  questionIndex: number;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

interface EvaluationsData {
  config: EvaluationConfig | null;
  examQuestions: QuestionItem[];
  activities: QuestionItem[];
  examAttempts: { id: number; score: number; passed: boolean; timeSpentSeconds: number; completedAt: string }[];
  activityAttempts: { id: number; activityId: number; score: number; completedAt: string }[];
}

interface EvaluationPanelProps {
  lessonId: number;
  accessToken: string;
  onContinue?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EvaluationPanel({ lessonId, accessToken, onContinue }: EvaluationPanelProps) {
  const [data, setData] = useState<EvaluationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase: 'idle' | 'activity' | 'activity-result' | 'exam' | 'exam-result'
  const [phase, setPhase] = useState<'idle' | 'activity' | 'activity-result' | 'exam' | 'exam-result'>('idle');

  // Answers state
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results
  const [activityResult, setActivityResult] = useState<{ score: number; details: ActivityDetail[] } | null>(null);
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean; passingScore: number } | null>(null);

  // Fetch evaluations when lesson changes
  useEffect(() => {
    if (!lessonId || !accessToken) return;

    let cancelled = false;

    async function fetchEvaluations() {
      try {
        setLoading(true);
        setError(null);
        setPhase('idle');
        setAnswers([]);
        setActivityResult(null);
        setExamResult(null);
        stopTimer();

        const res = await fetch(`/api/lessons/${lessonId}/evaluations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) throw new Error('Failed to load evaluations');

        const json: EvaluationsData = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvaluations();
    return () => { cancelled = true; };
  }, [lessonId, accessToken]);

  // Timer logic
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((minutes: number, onExpire: () => void) => {
    stopTimer();
    setTimeLeft(minutes * 60);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Format timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start activity
  const handleStartActivity = () => {
    if (!data) return;
    setAnswers(new Array(data.activities.length).fill(-1));
    setPhase('activity');
    startTimer(data.config?.activityDurationMinutes ?? 15, () => {
      handleSubmitActivity();
    });
  };

  // Start exam
  const handleStartExam = () => {
    if (!data) return;
    setAnswers(new Array(data.examQuestions.length).fill(-1));
    setPhase('exam');
    startTimer(data.config?.examDurationMinutes ?? 30, () => {
      handleSubmitExam();
    });
  };

  // Submit activity
  const handleSubmitActivity = async () => {
    if (!accessToken || submitting) return;
    stopTimer();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/lessons/${lessonId}/activity/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) throw new Error('Failed to submit activity');

      const result = await res.json();
      setActivityResult(result);
      setPhase('activity-result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar atividade');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit exam
  const handleSubmitExam = async () => {
    if (!accessToken || submitting || !data) return;
    stopTimer();
    setSubmitting(true);

    const elapsed = (data.config?.examDurationMinutes ?? 30) * 60 - timeLeft;

    try {
      const res = await fetch(`/api/lessons/${lessonId}/exam/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ answers, timeSpentSeconds: elapsed }),
      });

      if (!res.ok) throw new Error('Failed to submit exam');

      const result = await res.json();
      setExamResult(result);
      setPhase('exam-result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar prova');
    } finally {
      setSubmitting(false);
    }
  };

  // Retry exam
  const handleRetryExam = () => {
    if (!data) return;
    setAnswers(new Array(data.examQuestions.length).fill(-1));
    setExamResult(null);
    setPhase('exam');
    startTimer(data.config?.examDurationMinutes ?? 30, () => {
      handleSubmitExam();
    });
  };

  // Retry activity
  const handleRetryActivity = () => {
    if (!data) return;
    setAnswers(new Array(data.activities.length).fill(-1));
    setActivityResult(null);
    setPhase('activity');
    startTimer(data.config?.activityDurationMinutes ?? 15, () => {
      handleSubmitActivity();
    });
  };

  // Select answer
  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  // Determine what to show after activity result
  const shouldShowExamAfterActivity = data?.config?.hasExam && data.examQuestions.length > 0;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] bg-white p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" strokeWidth={2.5} />
      </div>
    );
  }

  // ─── No evaluations ───────────────────────────────────────────────────────
  if (!data?.config || (!data.config.hasActivity && !data.config.hasExam)) {
    return null;
  }

  if (error && !data) {
    return (
      <div className="border-2 border-red-500 rounded-xl shadow-[4px_4px_0px_#ef4444] bg-red-50 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" strokeWidth={2.5} />
        <p className="font-body text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  // ─── IDLE: Show available evaluations ─────────────────────────────────────
  if (phase === 'idle') {
    const hasActivity = data.config.hasActivity && data.activities.length > 0;
    const hasExam = data.config.hasExam && data.examQuestions.length > 0;

    return (
      <div className="space-y-4">
        {/* Activity Card */}
        {hasActivity && (
          <div className="border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] bg-emerald-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border-2 border-black rounded-xl bg-brand flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-lg uppercase tracking-wide mb-1">
                  Atividade Formativa
                </h3>
                <p className="font-body text-sm text-gray-600 mb-3">
                  {data.activities.length} questão(ões) • {data.config.activityDurationMinutes} min
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="primary" size="sm" onClick={handleStartActivity} className="gap-2">
                    <Play className="w-4 h-4" strokeWidth={2.5} />
                    Iniciar Atividade
                  </Button>
                  {data.activityAttempts.length > 0 && (
                    <span className="text-xs font-bold uppercase tracking-widest text-brand">
                      {data.activityAttempts.length} tentativa(s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exam Card */}
        {hasExam && (
          <div className="border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border-2 border-black rounded-xl bg-black flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-lg uppercase tracking-wide mb-1">
                  Prova de Conhecimento
                </h3>
                <p className="font-body text-sm text-gray-600 mb-3">
                  {data.examQuestions.length} questão(ões) • {data.config.examDurationMinutes} min •
                  Mínimo {data.config.examPassingScore}% para aprovação
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleStartExam} className="gap-2">
                    <Play className="w-4 h-4" strokeWidth={2.5} />
                    Iniciar Prova
                  </Button>
                  {data.examAttempts.length > 0 && (
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      {data.examAttempts.length} tentativa(s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ACTIVITY PHASE ───────────────────────────────────────────────────────
  if (phase === 'activity') {
    return (
      <div className="border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-50 border-b-2 border-black px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-brand" strokeWidth={2.5} />
            <h3 className="font-display font-bold text-sm uppercase tracking-wide">Atividade Formativa</h3>
          </div>
          <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_#000]">
            <Clock className="w-4 h-4 text-brand" strokeWidth={2.5} />
            <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-8">
          {data!.activities.map((q, qIdx) => (
            <div key={q.id} className="space-y-3">
              <p className="font-body font-medium text-base leading-relaxed">
                <span className="font-display font-bold text-brand mr-2">{qIdx + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-2 pl-4 md:pl-8">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${answers[qIdx] === optIdx
                        ? 'border-brand bg-emerald-50 shadow-[2px_2px_0px_#166534]'
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`activity-q-${qIdx}`}
                      checked={answers[qIdx] === optIdx}
                      onChange={() => handleSelectAnswer(qIdx, optIdx)}
                      className="mt-1 accent-brand w-4 h-4 shrink-0"
                    />
                    <span className="font-body text-sm leading-relaxed">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black px-6 py-4 bg-gray-50 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSubmitActivity}
            disabled={submitting || answers.every((a) => a === -1)}
            className="gap-2 min-w-[180px]"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                Enviar Respostas
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ─── ACTIVITY RESULT ──────────────────────────────────────────────────────
  if (phase === 'activity-result' && activityResult) {
    const allCorrect = activityResult.score === 100;

    return (
      <div className="border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] bg-white overflow-hidden">
        {/* Score Header */}
        <div className={`border-b-2 border-black px-6 py-6 text-center ${allCorrect ? 'bg-emerald-50' : 'bg-yellow-50'}`}>
          <div className={`w-16 h-16 border-2 border-black rounded-xl mx-auto mb-3 flex items-center justify-center ${allCorrect ? 'bg-brand' : 'bg-yellow-400'}`}>
            {allCorrect ? (
              <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
            ) : (
              <AlertTriangle className="w-8 h-8 text-black" strokeWidth={2.5} />
            )}
          </div>
          <h3 className="font-display font-bold text-2xl uppercase tracking-wide mb-1">
            {allCorrect ? 'Perfeito!' : 'Atividade Concluída'}
          </h3>
          <p className="font-body text-sm text-gray-600">
            Você acertou {activityResult.score}% das questões
          </p>
        </div>

        {/* Detailed Feedback */}
        <div className="p-6 space-y-4">
          {activityResult.details.map((detail, idx) => {
            const question = data!.activities[detail.questionIndex];
            if (!question) return null;

            return (
              <div key={detail.activityId} className={`border-2 rounded-xl p-4 ${detail.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="flex items-start gap-3 mb-3">
                  {detail.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                  )}
                  <p className="font-body text-sm font-medium leading-relaxed">
                    {idx + 1}. {question.question}
                  </p>
                </div>

                <div className="pl-8 space-y-1.5">
                  {question.options.map((opt, optIdx) => {
                    const isUserAnswer = detail.userAnswer === optIdx;
                    const isCorrectAnswer = detail.correctAnswer === optIdx;

                    let className = 'text-xs font-body px-2 py-1 rounded border ';
                    if (isCorrectAnswer) {
                      className += 'border-green-600 bg-green-100 text-green-800 font-bold';
                    } else if (isUserAnswer && !detail.isCorrect) {
                      className += 'border-red-400 bg-red-100 text-red-700 line-through';
                    } else {
                      className += 'border-transparent text-gray-500';
                    }

                    return (
                      <div key={optIdx} className={className}>
                        {String.fromCharCode(65 + optIdx)}. {opt}
                        {isCorrectAnswer && ' ✓'}
                        {isUserAnswer && !detail.isCorrect && ' ✗'}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="border-t-2 border-black px-6 py-4 bg-gray-50 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={handleRetryActivity} className="gap-2">
            <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
            Tentar Novamente
          </Button>

          {shouldShowExamAfterActivity ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPhase('idle');
                setActivityResult(null);
              }}
              className="gap-2"
            >
              Continuar para Prova
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Button>
          ) : onContinue ? (
            <Button variant="primary" size="sm" onClick={onContinue} className="gap-2">
              Próxima Aula
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  // ─── EXAM PHASE ───────────────────────────────────────────────────────────
  if (phase === 'exam') {
    return (
      <div className="border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-black border-b-2 border-black px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
            <h3 className="font-display font-bold text-sm uppercase tracking-wide text-white">Prova de Conhecimento</h3>
          </div>
          <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_#000]">
            <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-600' : 'text-black'}`} strokeWidth={2.5} />
            <span className={`font-mono font-bold text-sm ${timeLeft < 60 ? 'text-red-600' : 'text-black'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-8">
          {data!.examQuestions.map((q, qIdx) => (
            <div key={q.id} className="space-y-3">
              <p className="font-body font-medium text-base leading-relaxed">
                <span className="font-display font-bold text-black mr-2">{qIdx + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-2 pl-4 md:pl-8">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${answers[qIdx] === optIdx
                        ? 'border-black bg-gray-100 shadow-[2px_2px_0px_#000]'
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`exam-q-${qIdx}`}
                      checked={answers[qIdx] === optIdx}
                      onChange={() => handleSelectAnswer(qIdx, optIdx)}
                      className="mt-1 accent-black w-4 h-4 shrink-0"
                    />
                    <span className="font-body text-sm leading-relaxed">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black px-6 py-4 bg-gray-50 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSubmitExam}
            disabled={submitting || answers.every((a) => a === -1)}
            className="gap-2 min-w-[180px] bg-black text-white hover:bg-gray-800"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                Enviar Prova
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ─── EXAM RESULT ──────────────────────────────────────────────────────────
  if (phase === 'exam-result' && examResult) {
    return (
      <div className="border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] bg-white overflow-hidden">
        <div className={`border-b-2 border-black px-6 py-8 text-center ${examResult.passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className={`w-20 h-20 border-2 border-black rounded-xl mx-auto mb-4 flex items-center justify-center ${examResult.passed ? 'bg-brand' : 'bg-red-500'}`}>
            {examResult.passed ? (
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            ) : (
              <XCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            )}
          </div>
          <h3 className="font-display font-bold text-3xl uppercase tracking-wide mb-2">
            {examResult.passed ? 'Aprovado!' : 'Não Aprovado'}
          </h3>
          <p className="font-body text-lg text-gray-700 mb-1">
            Sua nota: <span className="font-bold">{examResult.score}%</span>
          </p>
          <p className="font-body text-sm text-gray-500">
            Nota mínima: {examResult.passingScore}%
          </p>
        </div>

        <div className="px-6 py-6 flex items-center justify-center gap-4">
          {!examResult.passed && (
            <Button variant="outline" onClick={handleRetryExam} className="gap-2">
              <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
              Tentar Novamente
            </Button>
          )}

          {(examResult.passed || !examResult.passed) && onContinue && (
            <Button
              variant="primary"
              onClick={onContinue}
              className={`gap-2 ${!examResult.passed ? 'bg-gray-800' : ''}`}
            >
              {examResult.passed ? 'Continuar' : 'Voltar ao Curso'}
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
