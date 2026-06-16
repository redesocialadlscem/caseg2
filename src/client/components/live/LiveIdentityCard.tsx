import { useState } from 'react';
import { IdCard, CheckCircle2, Loader2, Pencil } from 'lucide-react';

interface Props {
  sessionId: number;
  /** Nome usado no acesso (identificador — não muda). */
  participantName: string;
  initialCpf?: string;
}

/**
 * Cartão no player ao vivo: o aluno confirma o nome completo + CPF para o
 * certificado. Na "chamada" o nome costuma vir porco; aqui ele corrige sem
 * mudar o identificador usado nas interações/ranking.
 */
export function LiveIdentityCard({ sessionId, participantName, initialCpf }: Props) {
  const storeKey = `caseg2_identity_${sessionId}_${participantName}`;
  const [confirmed, setConfirmed] = useState(() => {
    try { return localStorage.getItem(storeKey) === '1'; } catch { return false; }
  });
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(participantName);
  const [cpf, setCpf] = useState(initialCpf || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/live-sessions/${sessionId}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: participantName, fullName: fullName.trim(), cpf: cpf.trim() }),
      });
      try { localStorage.setItem(storeKey, '1'); } catch { /* ignore */ }
      setConfirmed(true);
      setEditing(false);
    } catch { /* silencioso */ }
    finally { setSaving(false); }
  }

  // Estado confirmado (compacto)
  if (confirmed && !editing) {
    return (
      <div className="p-4 border-b-2 border-black bg-emerald-50">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-brand flex items-center gap-1.5 min-w-0">
            <CheckCircle2 size={15} strokeWidth={2.5} className="shrink-0" />
            <span className="truncate">Dados do certificado confirmados</span>
          </p>
          <button onClick={() => setEditing(true)} className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-brand">
            <Pencil size={12} /> editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border-b-2 border-black bg-yellow-50">
      <p className="text-xs font-display font-bold uppercase tracking-wide text-gray-700 flex items-center gap-1.5 mb-1">
        <IdCard size={14} strokeWidth={2.5} /> Dados do certificado
      </p>
      <p className="text-xs text-gray-600 mb-3">Confirme seu <strong>nome completo</strong> e <strong>CPF</strong> — é assim que vai sair no seu certificado.</p>
      <div className="space-y-2">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nome completo"
          className="w-full rounded-xl border-2 border-black px-3 py-2.5 text-sm font-medium shadow-brutal-sm focus:outline-none focus:ring-4 focus:ring-brand/30"
        />
        <input
          type="text"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="CPF (000.000.000-00)"
          className="w-full rounded-xl border-2 border-black px-3 py-2.5 text-sm font-medium shadow-brutal-sm focus:outline-none focus:ring-4 focus:ring-brand/30"
        />
        <button
          onClick={save}
          disabled={saving || !fullName.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-brand px-3 py-2.5 text-sm font-bold text-white shadow-brutal-sm transition-colors hover:bg-brand-light disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} strokeWidth={2.5} />}
          {saving ? 'Salvando…' : 'Confirmar para o certificado'}
        </button>
      </div>
    </div>
  );
}
