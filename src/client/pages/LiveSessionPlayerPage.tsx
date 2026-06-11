import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, Clock, User, CheckCircle2, AlertTriangle, 
  Wifi, WifiOff, PlayCircle, ShieldCheck 
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

type SessionStatus = 'waiting' | 'live' | 'completed';

/**
 * Player de Aula Ao Vivo — Página pública (acesso via portal)
 * Embed Jitsi + controles laterais + estados de sessão
 */
export function LiveSessionPlayerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as { participantName?: string; jitsiRoom?: string; waitingRoom?: boolean } | null;
  
  const [status, setStatus] = useState<SessionStatus>(stateData?.waitingRoom ? 'waiting' : 'waiting');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [participantName, setParticipantName] = useState(stateData?.participantName || 'Participante');
  const [sessionTitle, setSessionTitle] = useState('Carregando...');
  const [jitsiRoom, setJitsiRoom] = useState(stateData?.jitsiRoom || '');
  const [minDuration, setMinDuration] = useState(3600);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Buscar dados da sessão ao montar
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/admin/live-sessions/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        setSessionTitle(data.title || 'Aula Ao Vivo');
        setMinDuration((data.durationMinutes || 60) * 60);
        if (data.jitsiRoom) setJitsiRoom(data.jitsiRoom);
        if (data.status === 'live') setStatus('live');
        else if (data.status === 'completed') setStatus('completed');
        else setStatus('waiting');
      } catch {
        // Se não conseguir buscar, mantém waiting
      }
    }
    if (sessionId) fetchSession();
  }, [sessionId]);

  // Polling da sala de espera — verifica se o admin liberou a cada 8s
  useEffect(() => {
    if (status !== 'waiting' || !sessionId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/live-sessions/${sessionId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'live') {
          setStatus('live');
          if (data.jitsiRoom) setJitsiRoom(data.jitsiRoom);
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (data.status === 'completed' || data.status === 'cancelled') {
          setStatus('completed');
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // Ignora erros de polling silenciosamente
      }
    }, 8000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, sessionId]);

  // Timer da aula
  useEffect(() => {
    if (status === 'live') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min((elapsedSeconds / minDuration) * 100, 100);
  const canComplete = elapsedSeconds >= minDuration;

  const handleComplete = async () => {
    if (!canComplete || !sessionId) return;
    try {
      await fetch(`/api/admin/live-sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: participantName, companyCode: '' }),
      });
    } catch {
      // Continua mesmo se falhar — marca localmente
    }
    setStatus('completed');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleExit = () => {
    if (confirm('Tem certeza que deseja sair da aula? Seu progresso pode ser perdido.')) {
      navigate('/');
    }
  };

  // ─── TELA: SALA DE ESPERA ───
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center !bg-white brutal-border brutal-shadow">
          {/* Ícone de Relógio com animação pulse */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-50 rounded-xl border-2 border-black shadow-brutal mb-8 mx-auto">
            <Clock size={44} className="text-brand animate-pulse" />
          </div>
          
          <h2 className="font-display font-bold text-3xl text-black mb-4">
            Sala de Espera
          </h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Aguarde o administrador liberar o acesso à aula. Você será conectado automaticamente assim que a transmissão iniciar.
          </p>

          {/* Indicador visual de polling ativo */}
          <div className="inline-flex items-center gap-2 bg-gray-100 border-2 border-black rounded-lg px-4 py-2 mb-8">
            <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
              Verificando status...
            </span>
          </div>

          <div className="pt-6 border-t-2 border-black">
            <Button variant="outline" size="sm" onClick={handleExit} className="brutal-interactive">
              Voltar ao Início
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── TELA: AULA FINALIZADA ───
  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center !bg-white">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-brand text-white rounded-full border-2 border-black shadow-brutal mb-6 mx-auto">
            <ShieldCheck size={48} strokeWidth={2} />
          </div>
          <h2 className="font-display font-bold text-3xl text-black mb-3">
            Aula Concluída!
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            Parabéns, <strong>{participantName}</strong>!
          </p>
          <p className="text-gray-500 mb-8">
            Sua presença foi registrada e o certificado será gerado automaticamente.
          </p>

          <div className="bg-emerald-50 border-2 border-black rounded-xl p-5 shadow-brutal-sm mb-8 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-display font-bold uppercase tracking-wide text-gray-500">Duração Total</span>
              <span className="font-mono font-bold text-lg">{formatTime(elapsedSeconds)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-display font-bold uppercase tracking-wide text-gray-500">Curso</span>
              <span className="font-medium text-sm text-right max-w-[clamp(120px,18vw,200px)] truncate">{sessionTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-display font-bold uppercase tracking-wide text-gray-500">Status</span>
              <span className="inline-flex items-center gap-1.5 text-brand font-bold text-sm">
                <CheckCircle2 size={14} /> Certificável
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate('/certificates')} className="flex-1">
              Ver Certificado
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              Voltar ao Início
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── TELA: PLAYER ATIVO ───
  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header Minimalista */}
      <header className="bg-white border-b-2 border-black px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse shrink-0" />
          <h1 className="font-display font-bold text-sm sm:text-base truncate text-black">
            {sessionTitle}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleExit} className="shrink-0 !py-1.5 !px-3 !text-xs">
          <LogOut size={14} className="mr-1.5" />
          Sair
        </Button>
      </header>

      {/* Conteúdo Principal: Grid Responsivo */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Área do Vídeo (~70%) */}
        <main className="flex-1 bg-gray-900 relative flex items-center justify-center min-h-0">
          {/* Placeholder do Jitsi Embed */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <PlayCircle size={64} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-display font-bold text-lg">Jitsi Meet Embed</p>
              <p className="text-gray-600 text-sm mt-1">Sala: CASEG2-{sessionId}</p>
            </div>
          </div>
          {/* Em produção: <iframe src={`https://meet.jit.si/CASEG2-${sessionId}`} ... /> */}
        </main>

        {/* Barra Lateral de Controles (~30%) */}
        <aside className="w-full lg:w-80 xl:w-96 bg-white border-l-2 border-t-2 lg:border-t-0 border-black flex flex-col shrink-0 overflow-y-auto">
          {/* Info do Participante */}
          <div className="p-5 border-b-2 border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand text-white rounded-xl border-2 border-black shadow-brutal-sm flex items-center justify-center shrink-0">
                <User size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-display font-bold uppercase tracking-wide text-gray-500">Participante</p>
                <p className="font-bold text-sm truncate">{participantName}</p>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="p-5 border-b-2 border-black">
            <p className="text-xs font-display font-bold uppercase tracking-wide text-gray-500 mb-2">Tempo Decorrido</p>
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-brand shrink-0" />
              <span className="font-mono font-bold text-3xl tracking-tight">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            {/* Barra de Progresso Brutalista */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-gray-500">Progresso mínimo</span>
                <span className={canComplete ? 'text-brand' : 'text-gray-500'}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-4 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${canComplete ? 'bg-brand' : 'bg-yellow-400'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {!canComplete && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Mínimo: {formatTime(minDuration)}
                </p>
              )}
            </div>
          </div>

          {/* Status da Conexão */}
          <div className="p-5 border-b-2 border-black">
            <div className="flex items-center gap-2 text-sm">
              <Wifi size={16} className="text-brand" />
              <span className="font-medium text-green-700">Conectado à sala</span>
            </div>
          </div>

          {/* Ação Principal */}
          <div className="p-5 mt-auto">
            <Button
              onClick={handleComplete}
              disabled={!canComplete}
              className="w-full !py-4 !text-base"
            >
              {canComplete ? (
                <>
                  <CheckCircle2 size={20} className="mr-2" />
                  Concluir Aula
                </>
              ) : (
                <>
                  <Clock size={20} className="mr-2" />
                  Aguardar Tempo Mínimo
                </>
              )}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
