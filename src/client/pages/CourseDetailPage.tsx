import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, BookOpen, Award, ChevronRight, 
  Loader2, AlertTriangle, PlayCircle, FileText,
  Users, Target, ShieldCheck
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuthContext } from '../context/AuthContext';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  isActive: boolean;
  createdAt: string;
}

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCourse() {
      if (!id) return;
      
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/courses/${id}`);
        
        if (res.status === 404) {
          throw new Error('Curso não encontrado');
        }
        
        if (!res.ok) {
          throw new Error('Erro ao carregar curso');
        }

        const data = await res.json();
        if (!cancelled) setCourse(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCourse();
    return () => { cancelled = true; };
  }, [id]);

  function handleStartCourse() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}/player` } } });
      return;
    }
    navigate(`/courses/${id}/player`);
  }

  // Loading State - Skeleton Brutalista
  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Skeleton */}
          <div className="bg-white border-2 border-black rounded-xl shadow-brutal p-8 space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
            <div className="flex gap-4 mt-6">
              <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
              <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
              <div className="h-32 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error / 404 State
  if (error || !course) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 border-2 border-red-600 rounded-xl shadow-brutal-sm mb-6">
            <AlertTriangle size={40} className="text-red-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold uppercase mb-4">
            {error === 'Curso não encontrado' ? 'Curso Não Encontrado' : 'Ops! Algo Deu Errado'}
          </h1>
          <p className="text-gray-600 mb-8 font-medium">
            {error || 'O curso que você procura não existe ou foi removido.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/courses')}>
              Ver Todos os Cursos
            </Button>
            <Button onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Breadcrumb */}
      <div className="border-b-2 border-black bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
            <Link to="/courses" className="hover:text-brand transition-colors">Cursos</Link>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-gray-900 truncate max-w-[clamp(120px,18vw,200px)] sm:max-w-none">{course.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="bg-white border-2 border-black rounded-xl shadow-brutal p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 bg-brand text-white text-xs font-bold uppercase tracking-wide border-2 border-black rounded-lg shadow-brutal-sm">
                    {course.category}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-black text-xs font-bold uppercase tracking-wide border-2 border-black rounded-lg shadow-brutal-sm">
                    Online
                  </span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold uppercase tracking-tight leading-tight">
                  {course.title}
                </h1>
              </div>

              <div className="flex flex-col gap-3 min-w-[clamp(140px,18vw,200px)]">
                <Button size="lg" onClick={handleStartCourse} className="w-full">
                  <span className="flex items-center justify-center gap-2">
                    <PlayCircle size={20} strokeWidth={2.5} />
                    {isAuthenticated ? 'Continuar Curso' : 'Começar Curso'}
                  </span>
                </Button>
                {!isAuthenticated && (
                  <p className="text-xs text-center font-bold uppercase text-gray-500">
                    Login necessário para acessar
                  </p>
                )}
              </div>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed max-w-4xl font-medium">
              {course.description}
            </p>

            {/* Quick Stats Row */}
            <div className="mt-8 pt-8 border-t-2 border-black/10 flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 border-2 border-black rounded-lg shadow-brutal-sm">
                  <Clock size={20} className="text-brand" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Duração</p>
                  <p className="font-display font-bold">{course.durationHours}h</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 border-2 border-black rounded-lg shadow-brutal-sm">
                  <BookOpen size={20} className="text-brand" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Modalidade</p>
                  <p className="font-display font-bold">Online</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 border-2 border-black rounded-lg shadow-brutal-sm">
                  <Award size={20} className="text-brand" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Certificado</p>
                  <p className="font-display font-bold">Incluso</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sobre o Curso */}
            <Card className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Target size={24} className="text-brand" strokeWidth={2.5} />
                <h2 className="text-2xl font-display font-bold uppercase">Objetivos do Curso</h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Este treinamento capacita profissionais a identificar, avaliar e controlar riscos 
                  ambientais e ocupacionais conforme as Normas Regulamentadoras vigentes. 
                  Ao concluir, você estará apto a implementar medidas preventivas e garantir 
                  conformidade legal em ambientes industriais.
                </p>
              </div>
            </Card>

            {/* Público Alvo */}
            <Card className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Users size={24} className="text-brand" strokeWidth={2.5} />
                <h2 className="text-2xl font-display font-bold uppercase">Público-Alvo</h2>
              </div>
              <ul className="space-y-3">
                {[
                  'Técnicos de Segurança do Trabalho',
                  'Engenheiros de Segurança',
                  'Gestores de RH e Compliance',
                  'Cipeiros e Brigadistas'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <ShieldCheck size={20} className="text-brand shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Grade Curricular (Visual Only - Real data comes from player endpoint) */}
            <Card className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen size={24} className="text-brand" strokeWidth={2.5} />
                <h2 className="text-2xl font-display font-bold uppercase">Conteúdo Programático</h2>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((mod) => (
                  <div key={mod} className="border-2 border-black rounded-xl overflow-hidden">
                    <div className="bg-emerald-50 px-6 py-4 border-b-2 border-black flex items-center justify-between">
                      <h3 className="font-display font-bold uppercase flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-brand text-white text-sm font-bold border-2 border-black rounded-lg shadow-brutal-sm">
                          {mod}
                        </span>
                        Módulo {mod}: Fundamentos Essenciais
                      </h3>
                      <span className="text-xs font-bold uppercase text-gray-600 bg-white px-3 py-1 border-2 border-black rounded-lg shadow-brutal-sm">
                        4 Aulas
                      </span>
                    </div>
                    <div className="divide-y-2 divide-black/10">
                      {[1, 2, 3, 4].map((lesson) => (
                        <div key={lesson} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                          <FileText size={18} className="text-gray-400" strokeWidth={2.5} />
                          <span className="text-gray-700 font-medium flex-1">
                            Aula {lesson}: Introdução aos conceitos fundamentais
                          </span>
                          <span className="text-xs font-bold uppercase text-gray-400">
                            15 min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-emerald-50/50 border-2 border-dashed border-black/30 rounded-xl text-center">
                <p className="text-sm font-bold uppercase text-gray-600">
                  Grade completa disponível após início do curso
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="p-6 bg-emerald-50">
              <h3 className="font-display font-bold uppercase text-lg mb-4">Informações</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-bold uppercase text-gray-500 mb-1">Categoria</dt>
                  <dd className="font-bold text-gray-900">{course.category}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-gray-500 mb-1">Nível</dt>
                  <dd className="font-bold text-gray-900">Online</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-gray-500 mb-1">Carga Horária</dt>
                  <dd className="font-bold text-gray-900">{course.durationHours}h</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-gray-500 mb-1">Idioma</dt>
                  <dd className="font-bold text-gray-900">Português (BR)</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h3 className="font-display font-bold uppercase text-lg mb-4">O que você recebe</h3>
              <ul className="space-y-3">
                {[
                  'Acesso vitalício ao conteúdo',
                  'Certificado digital validado',
                  'Material de apoio em PDF',
                  'Suporte técnico especializado',
                  'Atualizações gratuitas'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <ShieldCheck size={16} className="text-brand shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Button size="lg" onClick={handleStartCourse} className="w-full">
              {isAuthenticated ? 'Ir para Player' : 'Matricular-se Agora'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
