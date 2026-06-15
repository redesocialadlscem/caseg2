import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { useAuthContext } from '../context/AuthContext';
import { Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, error: authError, setError } = useAuthContext();
  const { siteLogo } = useSiteSettings();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setLocalError('Preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), name.trim(), password);
      navigate('/dashboard', { replace: true });
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
            <div className="flex flex-col items-center gap-4 text-center">
              <img
                src={siteLogo}
                alt="CASEG Logo"
                className="h-40 w-auto object-contain"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/80">Bem-vindo</p>
                <h1 className="mt-2 text-4xl sm:text-5xl font-display font-bold uppercase text-white tracking-tight">Cadastro</h1>
                <p className="mt-2 text-sm font-body text-white/70 font-medium">Portal do Aluno & Segurança</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="text-center space-y-2 mb-8">
              <p className="font-body text-gray-600 font-medium">Comece seus treinamentos de segurança hoje.</p>
            </div>

            <Card className="border-2 border-black rounded-xl p-8">
              <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                {/* Error Banner */}
                {displayError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-600 shadow-[var(--shadow-brutal-sm)]">
                    <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-red-700 uppercase leading-snug">
                      {displayError}
                    </p>
                  </div>
                )}

                <Input
                  label="Nome Completo"
                  placeholder="Seu nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                />
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
                <Input
                  label="Senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={20} className="animate-spin" />
                        Cadastrando...
                      </span>
                    ) : (
                      'Finalizar Cadastro'
                    )}
                  </Button>
                </div>

                <p className="text-center text-sm font-medium text-gray-600 mt-2">
                  Já possui conta?{' '}
                  <Link to="/login" className="font-bold uppercase underline decoration-2 underline-offset-2 hover:text-brand">
                    Faça Login
                  </Link>
                </p>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
