import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Video, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

/**
 * Portal de Aula Ao Vivo — Página pública na Home
 * Acesso por código da empresa + nome do funcionário
 */
export function LiveSessionPortal() {
  const navigate = useNavigate();
  const [companyCode, setCompanyCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode.trim() || !employeeName.trim()) {
      setStatus('error');
      setErrorMessage('Preencha todos os campos para acessar.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/live-sessions/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyCode: companyCode.trim(),
          employeeName: employeeName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao acessar aula.');
      }

      const data = await res.json();
      setStatus('success');
      // Redirecionar após breve delay visual
      setTimeout(() => {
        navigate(`/live/${data.sessionId}`, {
          state: {
            participantName: data.participantName,
            jitsiRoom: data.jitsiRoom,
            waitingRoom: data.waitingRoom === true,
          },
        });
      }, 1200);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Erro inesperado. Tente novamente.');
    }
  };

  return (
    <section className="w-full py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header da Seção */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand text-white px-4 py-1.5 rounded-full border-2 border-black shadow-brutal-sm mb-4">
            <Video size={16} strokeWidth={2.5} />
            <span className="font-display font-bold text-xs uppercase tracking-widest">Ao Vivo</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-black mb-3">
            Portal de Treinamento
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Acesse sua aula ao vivo usando o código fornecido pela sua empresa.
          </p>
        </div>

        {/* Card Principal */}
        <Card variant="accent" className="!p-0 overflow-hidden">
          {/* Barra superior decorativa */}
          <div className="bg-brand h-3 w-full border-b-2 border-black" />

          <div className="p-6 sm:p-10">
            {status === 'success' ? (
              /* Estado de Sucesso — Redirecionando */
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-brand text-white rounded-full border-2 border-black shadow-brutal mb-6">
                  <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <h3 className="font-display font-bold text-2xl text-black mb-2">
                  Acesso Liberado!
                </h3>
                <p className="text-gray-600 mb-6">
                  Redirecionando para a sala de aula...
                </p>
                <div className="animate-pulse text-brand font-bold text-sm uppercase tracking-wide">
                  Aguarde um momento
                </div>
              </div>
            ) : (
              /* Formulário de Acesso */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campo Código da Empresa */}
                <div className="relative">
                  <label className="font-display font-bold text-xs uppercase tracking-wide mb-2 block">
                    Código da Empresa
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      <Building2 size={20} />
                    </div>
                    <input
                      type="text"
                      value={companyCode}
                      onChange={(e) => {
                        setCompanyCode(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      placeholder="Ex: ABC123"
                      className="w-full bg-white border-2 border-black rounded-xl pl-12 pr-4 py-3.5 font-body text-base placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow duration-150 uppercase tracking-wider font-bold"
                    />
                  </div>
                </div>

                {/* Campo Nome do Funcionário */}
                <div className="relative">
                  <label className="font-display font-bold text-xs uppercase tracking-wide mb-2 block">
                    Nome do Funcionário
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => {
                        setEmployeeName(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      placeholder="Seu nome completo"
                      className="w-full bg-white border-2 border-black rounded-xl pl-12 pr-4 py-3.5 font-body text-base placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow duration-150"
                    />
                  </div>
                </div>

                {/* Mensagem de Erro */}
                {status === 'error' && (
                  <div className="flex items-start gap-3 bg-red-50 border-2 border-red-600 rounded-xl p-4 shadow-[var(--shadow-brutal-sm)]">
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-red-700 font-medium text-sm">{errorMessage}</p>
                  </div>
                )}

                {/* Botão de Acesso */}
                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-3 !py-4 !text-lg"
                >
                  {status === 'loading' ? (
                    <>
                      <Lock size={20} className="animate-pulse" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Entrar na Aula
                      <ArrowRight size={20} />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Footer informativo */}
          <div className="bg-gray-50 border-t-2 border-black px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
              <Lock size={12} />
              <span>Acesso seguro • Certificado automático ao concluir</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
