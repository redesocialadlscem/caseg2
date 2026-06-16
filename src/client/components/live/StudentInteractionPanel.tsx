import { useEffect, useRef, useState } from 'react';
import { Zap, CheckCircle2, XCircle, Clock, Loader2, Hand, Send } from 'lucide-react';

type InteractionType = 'quiz' | 'truefalse' | 'poll' | 'keyword' | 'flash';

interface ActiveInteraction {
  sessionInteractionId: number;
  type: InteractionType;
  question: string;
  options: string[];
  timeLimitSeconds: number;
  openedAt: string;
}

interface Props {
  sessionId: number;
  participantName: string;
}

/** Painel do ALUNO: faz polling da interação aberta e permite responder. */
export function StudentInteractionPanel({ sessionId, participantName }: Props) {
  const [active, setActive] = useState<ActiveInteraction | null>(null);
  const [answeredId, setAnsweredId] = useState<number | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean | null; correctAnswer: number | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [text, setText] = useState('');
  const shownAtRef = useRef<Record<number, number>>({});

  // Polling da interação ativa
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/live-sessions/${sessionId}/active-interaction`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const next: ActiveInteraction | null = data.active;
        setActive((prev) => {
          if (next && (!prev || prev.sessionInteractionId !== next.sessionInteractionId)) {
            if (!shownAtRef.current[next.sessionInteractionId]) {
              shownAtRef.current[next.sessionInteractionId] = Date.now();
            }
            setText(''); // nova interação → limpa o campo de texto
          }
          return next;
        });
      } catch { /* silencioso */ }
    }
    poll();
    const id = setInterval(poll, 2500);
    return () => { cancelled = true; clearInterval(id); };
  }, [sessionId]);

  // Cronômetro
  useEffect(() => {
    if (!active) { setRemaining(0); return; }
    const opened = new Date(active.openedAt).getTime();
    const end = opened + active.timeLimitSeconds * 1000;
    const tick = () => setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [active]);

  const alreadyAnswered = active && answeredId === active.sessionInteractionId;
  const timeUp = remaining <= 0;

  async function submit(payload: { answer?: number; answerText?: string }) {
    if (!active || alreadyAnswered || submitting || timeUp) return;
    setSubmitting(true);
    try {
      const shownAt = shownAtRef.current[active.sessionInteractionId] || Date.now();
      const res = await fetch(`/api/session-interactions/${active.sessionInteractionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName, responseMs: Date.now() - shownAt, ...payload }),
      });
      const data = await res.json();
      setAnsweredId(active.sessionInteractionId);
      setResult({ isCorrect: data.isCorrect ?? null, correctAnswer: data.correctAnswer ?? null });
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  // ─── Idle: nenhuma interação aberta ──────────────────────────────────────
  if (!active) {
    return (
      <div className="p-5 border-b-2 border-black">
        <p className="text-xs font-display font-bold uppercase tracking-wide text-gray-500 mb-2">Interações</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap size={16} className="text-gray-300" />
          Aguardando o instrutor liberar uma atividade…
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border-b-2 border-black bg-emerald-50">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-display font-bold uppercase tracking-wide text-brand flex items-center gap-1.5">
          <Zap size={14} strokeWidth={2.5} /> Atividade ao vivo
        </p>
        <span className={`inline-flex items-center gap-1 rounded-md border-2 border-black px-2 py-0.5 text-xs font-bold ${timeUp ? 'bg-red-600 text-white' : 'bg-white'}`}>
          <Clock size={12} strokeWidth={2.5} /> {remaining}s
        </span>
      </div>

      <h4 className="font-display font-bold text-sm mb-3 leading-snug">{active.question}</h4>

      {/* PRESENÇA RELÂMPAGO — tocar para confirmar */}
      {active.type === 'flash' ? (
        <button
          onClick={() => submit({})}
          disabled={!!alreadyAnswered || submitting || timeUp}
          className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-black px-3 py-4 text-base font-display font-bold uppercase tracking-wide shadow-brutal transition-colors disabled:cursor-default ${alreadyAnswered ? 'bg-brand text-white' : 'bg-yellow-300 hover:bg-yellow-400'}`}
        >
          {alreadyAnswered ? <><CheckCircle2 size={20} strokeWidth={2.5} /> Presença confirmada</> : <><Hand size={20} strokeWidth={2.5} /> Estou presente!</>}
        </button>
      ) : active.type === 'keyword' ? (
        /* PALAVRA-CHAVE / COMPLETE A FRASE — resposta digitada */
        <form
          onSubmit={(e) => { e.preventDefault(); if (text.trim()) submit({ answerText: text.trim() }); }}
          className="space-y-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!!alreadyAnswered || submitting || timeUp}
            placeholder="Digite sua resposta…"
            className="w-full rounded-xl border-2 border-black px-3 py-2.5 text-sm font-medium shadow-brutal-sm focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:bg-gray-100"
            autoComplete="off"
          />
          {!alreadyAnswered && (
            <button
              type="submit"
              disabled={submitting || timeUp || !text.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-brand px-3 py-2.5 text-sm font-bold text-white shadow-brutal-sm transition-colors disabled:opacity-50"
            >
              <Send size={15} strokeWidth={2.5} /> Enviar resposta
            </button>
          )}
        </form>
      ) : (
        /* QUIZ / V-F / ENQUETE — alternativas */
        <div className="space-y-2">
          {active.options.map((opt, idx) => {
            const isCorrect = result?.correctAnswer === idx;
            let cls = 'bg-white hover:bg-gray-50';
            if (alreadyAnswered && result) {
              if (isCorrect) cls = 'bg-brand text-white';
              else cls = 'bg-white opacity-70';
            }
            return (
              <button
                key={idx}
                onClick={() => submit({ answer: idx })}
                disabled={!!alreadyAnswered || submitting || timeUp}
                className={`w-full text-left rounded-xl border-2 border-black px-3 py-2.5 text-sm font-medium shadow-brutal-sm transition-colors disabled:cursor-default ${cls}`}
              >
                <span className="inline-flex items-center gap-2">
                  {alreadyAnswered && result && isCorrect && <CheckCircle2 size={15} strokeWidth={2.5} />}
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback */}
      {alreadyAnswered && result && (
        <div className="mt-3 text-sm font-bold flex items-center gap-2">
          {result.isCorrect === null ? (
            <span className="text-brand flex items-center gap-1.5"><CheckCircle2 size={16} /> Resposta registrada!</span>
          ) : result.isCorrect ? (
            <span className="text-brand flex items-center gap-1.5"><CheckCircle2 size={16} /> Você acertou!</span>
          ) : (
            <span className="text-red-600 flex items-center gap-1.5"><XCircle size={16} /> Resposta incorreta.</span>
          )}
        </div>
      )}
      {submitting && (
        <div className="mt-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Enviando…</div>
      )}
      {timeUp && !alreadyAnswered && (
        <p className="mt-3 text-xs font-bold text-red-600">Tempo esgotado.</p>
      )}
    </div>
  );
}
