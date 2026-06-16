import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Users, Award,
  BookOpen, CheckCircle2, Mail,
  Globe, MessageSquare, Share2, Loader2, Search, Filter,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { CourseCard } from '../components/CourseCard';
import { PublicHeader } from '../components/PublicLayout';
import { COMPANY } from '../lib/company';

/* -------------------------------------------------------------------------------------------------
 * LOCAL COMPONENTS (Specific to Landing Page)
 * ----------------------------------------------------------------------------------------------- */

interface FeaturedCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  imageUrl: string;
  price: number;
}

function HeroSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch('/api/courses/featured')
      .then((res) => res.ok ? res.json() : [])
      .then((data: FeaturedCourse[]) => setFeaturedCourses(data))
      .catch(() => {});
  }, []);

  // Carrossel: avança sozinho a cada 5s (reinicia a contagem após navegação manual)
  useEffect(() => {
    if (featuredCourses.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % featuredCourses.length);
    }, 5000);
    return () => clearInterval(id);
  }, [featuredCourses.length, current]);

  const goCarousel = (dir: number) =>
    setCurrent((c) => (c + dir + featuredCourses.length) % featuredCourses.length);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      try { v.pause(); v.removeAttribute('autoPlay'); } catch {}
      return;
    }

    const onEnded = () => {
      v.style.opacity = '0';
      setTimeout(() => {
        try { v.currentTime = 0; } catch {}
        const p = v.play();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          void (p as Promise<void>).catch(() => {});
        }
        v.style.opacity = '1';
      }, 600);
    };

    v.addEventListener('ended', onEnded);
    return () => v.removeEventListener('ended', onEnded);
  }, []);

  return (
    <section className="relative z-0 min-h-[600px] flex items-center overflow-hidden">
      {/* Background Video — full coverage, no blend mode */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop
        preload="metadata"
        crossOrigin="anonymous"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* Gradient Overlay — lateral dark fade like casegprotege */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/80 via-black/60 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Plataforma líder em segurança
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-4xl md:text-6xl text-white leading-[1.1] mb-6">
            Segurança do Trabalho com <span className="text-emerald-400">Excelência</span>
          </h1>

          {/* Subtitle */}
          <p className="font-body text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mb-10">
            Do agronegócio à indústria: treinamentos das principais NRs, com certificação e aulas híbridas na mesma plataforma.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/courses">
              <button className="bg-brand text-white font-display font-bold text-base px-8 py-4 rounded-full shadow-lg shadow-brand/30 hover:bg-emerald-700 transition-all duration-200 w-full sm:w-auto text-center">
                Explorar Cursos
              </button>
            </Link>
            <a href="#diferenciais">
              <button className="border-2 border-white text-white font-display font-bold text-base px-8 py-4 rounded-full hover:bg-white hover:text-black transition-all duration-200 w-full sm:w-auto text-center">
                Saiba Mais
              </button>
            </a>
          </div>

          {/* Trust Indicators — clean style */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm font-body text-white/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">⭐ 4,9/5</span>
              <span>+3.000 alunos</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓ Conteúdo prático para aplicar no dia a dia</span>
            </div>
          </div>
        </div>

          {/* Highlight Card — clean corporate style */}
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-bold text-sm uppercase tracking-widest text-white">
                  Cursos em destaque
                </span>
                <Link to="/courses" className="text-xs font-bold uppercase tracking-wide text-emerald-400 hover:text-emerald-300 transition-colors">
                  Ver todos →
                </Link>
              </div>

              <div className="space-y-3">
                {featuredCourses.length > 0 ? (
                  (() => {
                    const course = featuredCourses[current] ?? featuredCourses[0];
                    return (
                      <div>
                        {/* Carrossel: um card por vez com setas laterais */}
                        <div className="relative">
                          <Link
                            key={course.id}
                            to={`/courses/${course.id}`}
                            className="block rounded-xl bg-white/95 overflow-hidden hover:bg-white transition-colors animate-in fade-in slide-in-from-right-3 duration-500"
                          >
                            <div className="relative aspect-video bg-emerald-100 flex items-center justify-center overflow-hidden">
                              {course.imageUrl ? (
                                <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <Badge variant="brand">{course.category}</Badge>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-display font-bold text-base uppercase text-black mb-1 line-clamp-1">{course.title}</h3>
                              <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">{course.durationHours}h de conteúdo</p>
                              <div className="flex items-center justify-between">
                                <span className="font-display font-bold text-sm text-brand">
                                  {course.price > 0 ? `R$ ${course.price.toFixed(2).replace('.', ',')}` : 'Grátis'}
                                </span>
                                <Button variant="primary" size="sm" className="text-xs">Matricule-se</Button>
                              </div>
                            </div>
                          </Link>

                          {featuredCourses.length > 1 && (
                            <>
                              <button
                                type="button"
                                aria-label="Curso anterior"
                                onClick={() => goCarousel(-1)}
                                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 border-2 border-white text-black shadow-lg backdrop-blur hover:bg-white hover:scale-110 active:scale-95 transition-all"
                              >
                                <ChevronLeft size={18} strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                aria-label="Próximo curso"
                                onClick={() => goCarousel(1)}
                                className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 border-2 border-white text-black shadow-lg backdrop-blur hover:bg-white hover:scale-110 active:scale-95 transition-all"
                              >
                                <ChevronRight size={18} strokeWidth={2.5} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Indicadores (dots) */}
                        {featuredCourses.length > 1 && (
                          <div className="flex justify-center gap-1.5 mt-3">
                            {featuredCourses.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                aria-label={`Ir ao destaque ${i + 1}`}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-xl bg-white/95 p-6 text-center">
                    <p className="font-body text-sm text-gray-500">Nenhum curso em destaque no momento</p>
                  </div>
                )}

                {/* Info Box */}
                <div className="rounded-xl bg-brand p-4 text-white">
                  <p className="text-xs uppercase tracking-wide text-emerald-200">Acesso imediato com certificado digital</p>
                  <p className="mt-1 font-display font-bold text-lg">Comece seus treinamentos agora</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ApiCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface CoursesResponse {
  courses: ApiCourse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const homeCategories = ['Todos', 'Normas Regulamentadoras', 'Gestão de Segurança', 'Emergências', 'Saúde Ocupacional', 'Meio Ambiente'];

function CoursesSection() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeCategory !== 'Todos') params.set('category', activeCategory);
      params.set('limit', '12');
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar cursos');
      const data: CoursesResponse = await res.json();
      setCourses(data.courses);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    const debounce = setTimeout(fetchCourses, 300);
    return () => clearTimeout(debounce);
  }, [fetchCourses]);

  const getCategoryCount = (cat: string) => {
    if (cat === 'Todos') return total;
    return courses.filter((c) => c.category === cat).length;
  };

  return (
    <section id="cursos" className="scroll-mt-24 py-16 bg-white border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 grid gap-6 lg:grid-cols-[1.6fr_0.9fr] items-center">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-brand">Catálogo de Treinamentos</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-display font-bold uppercase tracking-tight leading-tight">
              Cursos profissionais de segurança do trabalho
            </h2>
            <p className="mt-4 text-base text-gray-600 leading-relaxed">
              Encontre treinamentos especializados, com certificação e conteúdos focados em NRs, brigadas e prevenção.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-black bg-white p-6 shadow-brutal">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-brutal-sm">
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Cursos encontrados</p>
                <p className="font-display font-bold text-3xl text-black">{loading ? '...' : total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="border-2 border-black rounded-xl bg-white p-6 shadow-brutal">
              <h3 className="font-display font-bold text-xl uppercase tracking-tight mb-4">Áreas de SST</h3>
              <div className="space-y-3">
                {homeCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 font-display font-bold text-sm uppercase tracking-wide transition-all ${
                      activeCategory === cat
                        ? 'bg-brand text-white border-black shadow-brutal-sm'
                        : 'bg-white text-black border-black hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    <span>{cat}</span>
                    {!loading && <span className="ml-2 text-xs font-medium text-gray-500">{getCategoryCount(cat)}</span>}
                  </button>
                ))}
              </div>
            </Card>
            <Card className="border-2 border-black rounded-xl bg-white p-6 shadow-brutal">
              <h3 className="font-display font-bold text-xl uppercase tracking-tight mb-4">Dica rápida</h3>
              <p className="font-body text-sm text-gray-600 leading-relaxed">
                Use a busca e os filtros por área para encontrar cursos alinhados à norma e à sua rotina de trabalho.
              </p>
            </Card>
          </aside>

          {/* Main Content */}
          <section>
            {/* Search + Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.4fr] gap-6 mb-8">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2.5} />
                <Input placeholder="Buscar curso..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setActiveCategory('Todos'); }} className="w-full">Limpar</Button>
                <Button variant="primary" size="sm" onClick={() => setActiveCategory('Todos')} className="w-full">Tudo</Button>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center gap-3 mb-6">
              <BookOpen size={18} className="text-brand" strokeWidth={2.5} />
              <p className="font-body text-sm font-medium text-gray-500">
                {loading ? 'Carregando...' : `${total} ${total === 1 ? 'curso encontrado' : 'cursos encontrados'}`}
              </p>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="rounded-3xl border-2 border-black bg-white p-16 text-center shadow-brutal">
                <Loader2 size={40} className="mx-auto text-brand animate-spin mb-4" strokeWidth={2.5} />
                <p className="font-body text-sm text-gray-600">Carregando cursos...</p>
              </div>
            ) : error ? (
              <div className="rounded-3xl border-2 border-black bg-white p-12 text-center shadow-brutal">
                <Filter size={40} className="mx-auto text-red-500 mb-4" strokeWidth={2.5} />
                <h3 className="font-display font-bold text-lg uppercase text-black">Erro ao carregar</h3>
                <p className="font-body text-sm text-gray-600 mt-2">{error}</p>
                <Button variant="outline" size="sm" className="mt-6" onClick={fetchCourses}>Tentar novamente</Button>
              </div>
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    category={course.category}
                    durationHours={course.durationHours}
                    price={course.price ? `R$ ${course.price.toFixed(2).replace('.', ',')}` : undefined}
                    priceValue={course.price}
                    imageUrl={course.imageUrl}
                    progress={0}
                    onClick={() => navigate(`/courses/${course.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-black bg-white p-12 text-center shadow-brutal">
                <Filter size={40} className="mx-auto text-brand mb-4" strokeWidth={2.5} />
                <h3 className="font-display font-bold text-lg uppercase text-black">Nenhum curso encontrado</h3>
                <p className="font-body text-sm text-gray-600 mt-2">Ajuste os filtros ou a busca para ampliar os resultados.</p>
                <Button variant="outline" size="sm" className="mt-6" onClick={() => { setSearch(''); setActiveCategory('Todos'); }}>Limpar Filtros</Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Segurança Garantida",
      description: "Conteúdo atualizado conforme as normas regulamentadoras vigentes e melhores práticas de mercado."
    },
    {
      icon: Users,
      title: "Comunidade Ativa",
      description: "Acesso a fóruns exclusivos, mentoria com especialistas e networking com profissionais da área."
    },
    {
      icon: Award,
      title: "Certificação Reconhecida",
      description: "Certificados válidos em todo território nacional, aceitos por grandes empresas e auditorias."
    }
  ];

  return (
    <section id="diferenciais" className="py-16 bg-emerald-50 border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">Por que escolher a CASEG?</h2>
          <p className="font-body text-gray-700 max-w-2xl mx-auto">Oferecemos uma experiência de aprendizado completa focada na aplicação prática do conhecimento.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col items-center text-center brutal-interactive">
              <div className="w-16 h-16 bg-brand border-2 border-black flex items-center justify-center text-white mb-6 shadow-brutal-sm rounded-xl">
                <feature.icon size={32} strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 uppercase">{feature.title}</h3>
              <p className="font-body text-gray-700 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="sobre" className="py-16 bg-white border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand font-bold">Sobre a CASEG Protege</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">Educação em segurança com foco na prática e no resultado.</h2>
            <p className="mt-6 font-body text-gray-700 leading-relaxed max-w-2xl">
              Nossa missão é capacitar profissionais para atuar com confiança nas rotinas de segurança do trabalho, combinando conteúdo técnico atualizado, certificação reconhecida e atendimento humano.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-black bg-emerald-50 p-6 shadow-brutal">
                <h3 className="font-display font-bold text-lg mb-3">Treinamentos NR completos</h3>
                <p className="font-body text-gray-700 leading-relaxed">Conteúdo alinhado às normas e preparado para aplicação imediata no seu ambiente de trabalho.</p>
              </div>
              <div className="rounded-xl border-2 border-black bg-white p-6 shadow-brutal">
                <h3 className="font-display font-bold text-lg mb-3">Projetos para empresas</h3>
                <p className="font-body text-gray-700 leading-relaxed">Soluções personalizadas para capacitação de equipes e implantação de cultura de prevenção.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-xl border-2 border-black bg-black text-white shadow-brutal p-8">
              <div className="text-brand-light text-xs uppercase tracking-[0.3em] mb-4 font-bold">Apostila digital</div>
              <h3 className="font-display font-bold text-3xl">Material atualizado sempre.</h3>
              <p className="mt-4 font-body text-gray-300 leading-relaxed">Acesso a conteúdos em PDF, checklists e guias para consulta rápida durante a rotina.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border-2 border-black bg-brand px-5 py-6 text-white shadow-brutal">
                <div className="font-display font-bold text-3xl">+50</div>
                <div className="mt-3 text-sm uppercase tracking-[0.2em] font-bold">Cursos ativos</div>
              </div>
              <div className="rounded-xl border-2 border-black bg-white p-5 shadow-brutal">
                <div className="font-display font-bold text-3xl text-black">24/7</div>
                <div className="mt-3 text-sm uppercase tracking-[0.2em] text-gray-700 font-bold">Suporte e atendimento</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "+500", label: "Alunos Certificados", icon: Users },
    { value: "98%", label: "Taxa de Aprovação", icon: Award },
    { value: "+50", label: "Cursos Disponíveis", icon: BookOpen },
    { value: "24/7", label: "Suporte Dedicado", icon: CheckCircle2 },
  ];

  return (
    <section className="py-16 bg-emerald-50 border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center p-6 bg-white border-2 border-black shadow-brutal rounded-xl">
              <div className="mb-4 text-brand">
                <stat.icon size={32} strokeWidth={2.5} />
              </div>
              <div className="font-display font-bold text-4xl md:text-5xl mb-2 text-black">
                {stat.value}
              </div>
              <div className="font-body font-bold text-gray-700 uppercase tracking-wide text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    name: 'Carlos Mendes',
    role: 'Técnico de Segurança — Usinas Corcovado',
    quote: 'Completei a NR-35 e NR-10 pela CASEG em menos de uma semana. O conteúdo é direto ao ponto, sem enrolação. Já indiquei pra toda a equipe.',
    rating: 5,
  },
  {
    name: 'Fernanda Oliveira',
    role: 'Engenheira de Produção — AgroPalma',
    quote: 'A plataforma é muito fácil de usar. Consegui capacitar 40 colaboradores remotamente com certificado válido. Economia enorme em deslocamento.',
    rating: 5,
  },
  {
    name: 'Roberto Silva',
    role: 'Gerente de RH — MetalForge Indústria',
    quote: 'O suporte é excelente. Tivemos dúvida sobre validade do certificado e resolveram em minutos. Profissionalismo de verdade.',
    rating: 5,
  },
];

function TestimonialsSection() {
  return (
    <section className="py-16 bg-white border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-brand font-bold">Quem já estudou conosco</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">O que nossos alunos dizem</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border-2 border-black bg-white p-6 shadow-brutal flex flex-col">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-brand text-lg">★</span>
                ))}
              </div>
              <p className="font-body text-gray-700 leading-relaxed flex-1 mb-6">"{t.quote}"</p>
              <div className="border-t-2 border-black pt-4">
                <p className="font-display font-bold text-sm uppercase">{t.name}</p>
                <p className="font-body text-xs text-gray-500 mt-1">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactBannerSection() {
  return (
    <section className="py-16 bg-emerald-50 border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-brand font-bold">Fale conosco</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl mt-4 mb-6">
          Preciso de ajuda ou quer uma proposta?
        </h2>
        <p className="font-body text-gray-700 max-w-2xl mx-auto mb-8">
          Nossa equipe está pronta para responder dúvidas sobre cursos, propostas para empresas e parcerias.
        </p>
        <Link
          to="/contato"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-8 py-4 font-display font-bold uppercase tracking-wide text-black shadow-brutal brutal-interactive"
        >
          <Mail size={18} />
          Acessar página de contato
        </Link>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-white font-body text-black">
      <PublicHeader />
      <main>
        <HeroSection />
        <CoursesSection />
        <FeaturesSection />
        <AboutSection />
        <StatsSection />
        <TestimonialsSection />
        <ContactBannerSection />
      </main>
      <footer className="bg-gray-900 text-white border-t-4 border-brand">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="font-display font-bold text-xl mb-4">CASEG Protege</h3>
              <p className="font-body text-sm text-gray-400 leading-relaxed">
                Capacitando profissionais com excelência em segurança do trabalho desde 2020.
              </p>
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-4">Links Rápidos</h3>
              <ul className="space-y-2 font-body text-sm text-gray-400">
                <li><Link to="/courses" className="hover:text-brand transition-colors">Cursos</Link></li>
                <li><a href="#sobre" className="hover:text-brand transition-colors">Sobre Nós</a></li>
                <li><Link to="/contato" className="hover:text-brand transition-colors">Contato</Link></li>
                <li><Link to="/privacidade" className="hover:text-brand transition-colors">Política de Privacidade</Link></li>
                <li><Link to="/termos" className="hover:text-brand transition-colors">Termos de Uso</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-4">Categorias</h3>
              <ul className="space-y-2 font-body text-sm text-gray-400">
                <li>Normas Regulamentadoras</li>
                <li>Gestão de Segurança</li>
                <li>Emergências</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-4">Social</h3>
              <div className="flex gap-4">
                <Globe size={20} className="text-gray-400 hover:text-brand cursor-pointer transition-colors" />
                <MessageSquare size={20} className="text-gray-400 hover:text-brand cursor-pointer transition-colors" />
                <Share2 size={20} className="text-gray-400 hover:text-brand cursor-pointer transition-colors" />
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center font-body text-sm text-gray-500 space-y-1">
            <p>{COMPANY.nomeFantasia} · CNPJ {COMPANY.cnpj}</p>
            <p>© 2025 {COMPANY.marca}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
