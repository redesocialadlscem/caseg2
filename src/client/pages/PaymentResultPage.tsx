import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { PublicHeader } from '../components/PublicLayout';

export function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'pending';
  const courseId = searchParams.get('external_reference');

  let parsedCourseId: string | null = null;
  try {
    if (courseId) {
      const ref = JSON.parse(courseId);
      parsedCourseId = ref.courseId;
    }
  } catch {
    // ignore parse errors
  }

  const configs = {
    approved: {
      icon: CheckCircle2,
      title: 'Pagamento Aprovado!',
      description: 'Seu pagamento foi confirmado com sucesso. Você já pode acessar o curso.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      buttonText: 'Acessar Curso',
      buttonLink: parsedCourseId ? `/courses/${parsedCourseId}/player` : '/dashboard',
    },
    pending: {
      icon: Clock,
      title: 'Pagamento Pendente',
      description: 'Seu pagamento está sendo processado. Assim que for confirmado, você receberá um e-mail e poderá acessar o curso.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      buttonText: 'Voltar ao Dashboard',
      buttonLink: '/dashboard',
    },
    rejected: {
      icon: XCircle,
      title: 'Pagamento Recusado',
      description: 'Infelizmente seu pagamento não foi aprovado. Tente novamente com outro método de pagamento.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      buttonText: 'Tentar Novamente',
      buttonLink: parsedCourseId ? `/courses/${parsedCourseId}` : '/courses',
    },
  };

  const config = configs[status as keyof typeof configs] || configs.pending;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,101,52,0.12),transparent_28%),linear-gradient(180deg,_#f0fdf4,_#ecfccb)]">
      <PublicHeader />
      <main className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className={`max-w-lg w-full ${config.bgColor} border-2 ${config.borderColor} rounded-xl p-8 text-center shadow-brutal`}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-2 border-black mb-6`}>
            <Icon size={40} className={config.color} />
          </div>
          
          <h1 className="font-display font-bold text-2xl uppercase tracking-tight mb-3">
            {config.title}
          </h1>
          
          <p className="font-body text-gray-600 mb-8 leading-relaxed">
            {config.description}
          </p>
          
          <div className="flex flex-col gap-3">
            <Link to={config.buttonLink}>
              <Button variant="primary" className="w-full justify-center">
                {config.buttonText}
              </Button>
            </Link>
            <Link to="/">
              <button className="w-full flex items-center justify-center gap-2 font-body font-medium text-sm text-gray-500 hover:text-brand transition-colors py-2">
                <ArrowLeft size={16} />
                Voltar ao início
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
