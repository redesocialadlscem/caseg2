import { useCallback, useEffect, useState } from 'react';
import { Trophy, Zap, Target } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface RankingEntry {
  name: string;
  answered: number;
  correct: number;
  fast: number;
  avgMs: number;
  points: number;
  attention: number;
}

interface Props {
  sessionId: number;
  accessToken: string | null;
}

/** Painel de RANKING/pontuação ao vivo (visão do instrutor). */
export function LiveRankingPanel({ sessionId, accessToken }: Props) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/admin/live-sessions/${sessionId}/ranking`, accessToken);
      const data = await res.json();
      setRanking(data.ranking ?? []);
    } catch { /* ignore */ }
  }, [sessionId, accessToken]);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  const medal = (i: number) => (i === 0 ? 'bg-amber-300' : i === 1 ? 'bg-gray-200' : i === 2 ? 'bg-orange-200' : 'bg-white');

  return (
    <div className="p-5 border-b-2 border-black">
      <p className="text-xs font-display font-bold uppercase tracking-wide text-brand flex items-center gap-1.5 mb-3">
        <Trophy size={14} strokeWidth={2.5} /> Ranking ao vivo
      </p>

      {ranking.length === 0 ? (
        <p className="text-sm text-gray-500">Sem participação ainda. Os pontos aparecem conforme os alunos respondem.</p>
      ) : (
        <div className="space-y-2">
          {ranking.slice(0, 12).map((r, i) => (
            <div key={r.name} className={`flex items-center gap-3 rounded-xl border-2 border-black p-2.5 shadow-brutal-sm ${medal(i)}`}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white text-xs font-display font-bold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm truncate">{r.name}</p>
                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
                  <span className="inline-flex items-center gap-0.5"><Target size={11} strokeWidth={2.5} /> {r.correct}/{r.answered}</span>
                  <span className="inline-flex items-center gap-0.5"><Zap size={11} strokeWidth={2.5} /> {r.attention}%</span>
                </div>
              </div>
              <span className="shrink-0 rounded-lg border-2 border-black bg-brand px-2 py-1 text-xs font-bold text-white">
                {r.points} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
