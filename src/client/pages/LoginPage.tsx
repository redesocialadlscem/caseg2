import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { useAuthContext } from '../context/AuthContext';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, setError } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!email.trim() || !password) {
      setLocalError('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch {
      // Error is already set in useAuth context
    } finally {
      setLoading(false);
    }
  }

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-surface">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="rounded-xl border-2 border-black bg-white shadow-brutal overflow-hidden">
          {/* Header sólido - ZERO gradientes conforme DESIGN_SYSTEM */}
          <div className="bg-brand px-8 py-6 border-b-2 border-black">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-black text-white border-2 border-black shadow-brutal">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/80">Acesso Seguro</p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold uppercase text-white tracking-tight">Login</h1>
            </div>
          </div>
          <div className="p-8">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-4xl sm:text-5xl font-display font-bold uppercase tracking-tight">CASEG</h2>
              <p className="font-body text-gray-600 font-medium">Portal do Aluno & Segurança</p>
            </div>

            <Card className="border-2 border-black rounded-xl p-8">
              <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-bold uppercase">Acessar Conta</h3>
                  <p className="text-sm text-gray-500">Entre com suas credenciais para continuar.</p>
                </div>

                {/* Error Banner */}
                {displayError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-600 shadow-[var(--shadow-brutal-sm)]">
                    <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-red-700 uppercase leading-snug">
                      {displayError}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <Input
                    label="E-mail Corporativo"
                    type="email"
                    placeholder="nome@empresa.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                  <div className="space-y-1">
                    <Input
                      label="Senha"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    'Entrar no Sistema'
                  )}
                </Button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t-2 border-black/10"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold uppercase text-gray-400">ou</span>
                  <div className="flex-grow border-t-2 border-black/10"></div>
                </div>

                <Link
                  to="/register"
                  className="inline-flex w-full items-center justify-center bg-black text-white border-2 border-black shadow-brutal hover:bg-white hover:text-black font-display font-bold uppercase tracking-wide px-6 py-3 rounded-xl transition-all brutal-interactive disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  Criar Nova Conta
                </Link>
              </form>
            </Card>

            <footer className="text-center text-xs font-mono text-gray-500 uppercase mt-8">
              © 2024 CASEG Protege. Todos os direitos reservados.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
