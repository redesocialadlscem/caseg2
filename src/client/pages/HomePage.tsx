import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Award, Clock, Layers, Menu, X, 
  BookOpen, CheckCircle2, Mail, Phone, MapPin,
  Globe, MessageSquare, Share2, Loader2
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { CourseCard } from '../components/CourseCard';
import { PublicHeader } from '../components/PublicLayout';

/* -------------------------------------------------------------------------------------------------
 * LOCAL COMPONENTS (Specific to Landing Page)
 * ----------------------------------------------------------------------------------------------- */

function HeroSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    <section className="relative z-0 py-10 md:py-16 border-b-2 border-black overflow-hidden">
      {/* Background Video with fade-on-loop (Neo-Brutalist: no gradient/blur) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
          opacity: 1, transition: 'opacity 600ms ease', willChange: 'opacity',
        }}
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      {/* Solid overlay — Neo-Brutalist: NO gradient, NO blur */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.4)', zIndex: 1 }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white border-2 border-black rounded-xl shadow-brutal-sm">
              <span className="font-display font-bold text-xs uppercase tracking-widest text-brand">
                Plataforma líder em segurança
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl leading-[1.05] mb-4">
              Segurança do Trabalho com <span className="text-brand">Excelência</span>
            </h1>
            <p className="font-body text-base md:text-lg text-gray-700 mb-6 leading-relaxed max-w-xl">
              Do agronegócio à indústria: treinamentos das principais NRs, com certificação e aulas híbridas na mesma plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/courses">
                <Button variant="primary" size="lg" className="w-full sm:w-auto justify-center">
                  Explorar Cursos
                </Button>
              </Link>
              <a href="#diferenciais">
                <Button variant="outline" size="lg" className="w-full sm:w-auto justify-center">
                  Saiba Mais
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-body text-gray-800">
              <div className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2 shadow-brutal-sm">
                <span className="font-bold">⭐ 4,9/5</span>
                <span>+3.000 alunos</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2 shadow-brutal-sm">
                <span>Conteúdo prático para aplicar no dia a dia</span>
              </div>
            </div>
          </div>

          {/* Highlight Card - Solid Brand BG */}
          <div className="relative">
            <div className="border-2 border-black bg-brand shadow-brutal rounded-xl text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-bold text-sm uppercase tracking-widest text-white">
                  Cursos em destaque
                </span>
                <Link to="/courses" className="rounded-xl border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-black brutal-interactive hover:bg-gray-100">
                  Ver todos
                </Link>
              </div>

              <div className="space-y-4">
                {/* Mini Course Card */}
                <div className="rounded-xl border-2 border-black bg-white overflow-hidden shadow-brutal-sm">
                  <div className="relative aspect-video bg-emerald-100 flex items-center justify-center border-b-2 border-black">
                    <Badge variant="brand">EPI</Badge>
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="font-display font-bold text-lg uppercase text-black mb-1">Curso de EPI</h3>
                    <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">2 horas · 3 aulas</p>
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-base text-brand">R$ 0,30</span>
                      <Button variant="primary" size="sm" className="text-xs">Matricule-se</Button>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-xl border-2 border-black bg-black p-4 text-white shadow-brutal-sm">
                  <p className="text-xs uppercase tracking-wide text-brand-light">Acesso imediato com certificado digital</p>
                  <p className="mt-2 font-display font-bold text-xl">Comece seus treinamentos agora</p>
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
  isActive: boolean;
  createdAt: string;
}

function PopularCoursesSection() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPopularCourses() {
      try {
        const res = await fetch('/api/courses?limit=3');
        if (!res.ok) throw new Error('Falha ao carregar cursos');
        const data = await res.json();
        if (!cancelled) {
          setCourses(data.courses ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchPopularCourses();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-16 bg-white border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-2">Cursos Populares</h2>
            <p className="font-body text-gray-700">Os treinamentos mais procurados pelos profissionais.</p>
          </div>
          <Link 
            to="/courses" 
            className="font-display font-bold text-brand hover:text-black underline decoration-2 underline-offset-4 transition-colors"
          >
            Ver todos os cursos →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border-2 border-black bg-white p-6 shadow-brutal animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 border-2 border-black" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border-2 border-black bg-white p-12 text-center shadow-brutal">
            <p className="font-body text-gray-700 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                category={course.category}
                durationHours={course.durationHours}
                progress={0}
                onClick={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </div>
        )}
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
    quote: 'Os cursos transformaram minha carreira. Consegui minha certificação NR-10 e já estou aplicando todo conhecimento no meu trabalho.',
    name: 'Carlos Silva',
    role: 'Técnico de Segurança',
  },
  {
    quote: 'Conteúdo muito bem estruturado e atualizado. Os instrutores são excelentes e o suporte é incrível. Recomendo para todos da área.',
    name: 'Ana Rodrigues',
    role: 'Engenheira de Segurança',
  },
  {
    quote: 'Plataforma muito intuitiva. Consegui fazer os cursos pelo celular nos intervalos do trabalho. Certificado reconhecido em todo Brasil.',
    name: 'Pedro Santos',
    role: 'Operador Industrial',
  },
];

const faqItems = [
  {
    question: 'Preciso de experiência prévia?',
    answer: 'Não. Os cursos são desenhados para iniciantes e profissionais em diferentes níveis, com conteúdo prático e didático.',
  },
  {
    question: 'Recebo certificado?',
    answer: 'Sim. Todos os cursos oferecem certificado digital ao concluir as atividades e avaliações necessárias.',
  },
  {
    question: 'Posso assistir pelo celular?',
    answer: 'Pode. A plataforma é responsiva e permite assistir aulas no celular, tablet ou computador.',
  },
  {
    question: 'Como faço matrícula?',
    answer: 'Basta escolher o curso no catálogo e seguir até o carrinho. Estamos disponíveis para suporte caso precise de ajuda.',
  },
];

const newsList = [
  {
    title: 'Nova Atualização da NR 18',
    category: 'Normas',
    date: '15 JAN 2024',
    description: 'Mudanças significativas nas normas de segurança na construção civil entram em vigor em 2024.',
  },
  {
    title: 'SIPAT 2024: Guia Completo',
    category: 'Eventos',
    date: '10 JAN 2024',
    description: 'Tudo que você precisa saber para organizar uma Semana Interna de Prevenção de Acidentes de Trabalho.',
  },
  {
    title: 'Novos EPIs com Tecnologia IoT',
    category: 'Tecnologia',
    date: '05 JAN 2024',
    description: 'Conheça os equipamentos de proteção inteligentes que monitoram a saúde do trabalhador em tempo real.',
  },
];

function TestimonialsSection() {
  return (
    <section className="py-16 bg-white border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-brand font-bold">Quem entrou, aprovou</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">Resultados reais de quem escolheu evoluir com a CASEG Protege.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div key={item.name} className="rounded-xl border-2 border-black bg-emerald-50 p-8 shadow-brutal">
              <p className="font-body text-base leading-relaxed text-gray-800">"{item.quote}"</p>
              <div className="mt-6 border-t-2 border-black pt-5">
                <p className="font-display font-bold uppercase tracking-wide">{item.name}</p>
                <p className="font-body text-sm text-gray-600">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-16 bg-emerald-50 border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-brand font-bold">Tire suas dúvidas</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">As principais dúvidas antes da matrícula</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-xl border-2 border-black bg-white p-6 shadow-brutal">
              <h3 className="font-display font-bold uppercase tracking-wide text-sm mb-3">{item.question}</h3>
              <p className="font-body text-sm text-gray-700 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsSection() {
  return (
    <section className="py-16 bg-white border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-brand font-bold">Notícias e atualizações</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">Segurança do trabalho, NRs e prevenção</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsList.map((item) => (
            <div key={item.title} className="rounded-xl border-2 border-black bg-emerald-50 p-6 shadow-brutal">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-800">{item.category}</span>
                <span className="text-xs uppercase tracking-wide text-gray-600">{item.date}</span>
              </div>
              <h3 className="font-display font-bold text-xl mb-3 leading-tight">{item.title}</h3>
              <p className="font-body text-sm text-gray-700 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contato" className="py-16 bg-emerald-50 border-b-2 border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-brand font-bold">Fale conosco</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">Pronto para tirar suas dúvidas ou solicitar uma proposta?</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-6">
            <div className="rounded-xl border-2 border-black bg-white p-8 shadow-brutal">
              <div className="mb-6 flex items-center gap-4 text-brand">
                <Mail size={28} />
                <div>
                  <p className="font-display font-bold text-xl">E-mail</p>
                  <p className="font-body text-sm text-gray-600">contato@casegprotege.com.br</p>
                </div>
              </div>
              <div className="mb-6 flex items-center gap-4 text-brand">
                <Phone size={28} />
                <div>
                  <p className="font-display font-bold text-xl">Telefone</p>
                  <p className="font-body text-sm text-gray-600">(11) 99999-9999</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-brand">
                <MapPin size={28} />
                <div>
                  <p className="font-display font-bold text-xl">Endereço</p>
                  <p className="font-body text-sm text-gray-600">São Paulo, SP - Brasil</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-black bg-black p-8 text-white shadow-brutal">
              <p className="font-display font-bold text-2xl">Atendimento rápido</p>
              <p className="mt-4 font-body text-sm leading-relaxed text-gray-300">
                Nosso time está disponível para responder dúvidas sobre cursos, propostas para empresas e parcerias.
              </p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-black bg-white p-8 shadow-brutal">
            <form className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="font-display font-bold text-sm uppercase tracking-wide block mb-2">Nome</label>
                <input id="contact-name" type="text" className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 font-body focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/30" placeholder="Seu nome completo" />
              </div>
              <div>
                <label htmlFor="contact-email" className="font-display font-bold text-sm uppercase tracking-wide block mb-2">E-mail</label>
                <input id="contact-email" type="email" className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 font-body focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/30" placeholder="seu@email.com" />
              </div>
              <div>
                <label htmlFor="contact-message" className="font-display font-bold text-sm uppercase tracking-wide block mb-2">Mensagem</label>
                <textarea id="contact-message" rows={4} className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 font-body focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/30" placeholder="Como podemos ajudar?" />
              </div>
              <Button variant="primary" size="lg" className="w-full justify-center">
                Enviar Mensagem
              </Button>
            </form>
          </div>
        </div>
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
        <PopularCoursesSection />
        <FeaturesSection />
        <AboutSection />
        <StatsSection />
        <TestimonialsSection />
        <FAQSection />
        <NewsSection />
        <ContactSection />
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
                <li><a href="#contato" className="hover:text-brand transition-colors">Contato</a></li>
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
          <div className="mt-12 pt-8 border-t border-gray-800 text-center font-body text-sm text-gray-500">
            © 2024 CASEG Protege. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
