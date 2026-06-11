import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlayCircle, CheckCircle2, ChevronDown, ChevronRight, 
  Lock, Loader2, AlertTriangle, ArrowLeft, ArrowRight,
  BookOpen, FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';

// Types matching backend response
interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  content: string;
  videoUrl: string;
  orderIndex: number;
  completed: boolean;
}

interface Module {
  id: number;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
}

interface PlayerData {
  course: Course;
  modules: Module[];
}

export function CoursePlayerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [mobileTab, setMobileTab] = useState<'content' | 'syllabus'>('content');
  const [markingComplete, setMarkingComplete] = useState(false);

  // Fetch course data
  useEffect(() => {
    if (!courseId || !accessToken) return;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}/player`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!res.ok) throw new Error('Failed to load course');
        
        const json: PlayerData = await res.json();
        setData(json);

        // Auto-expand first module and select first lesson if none selected
        if (json.modules.length > 0) {
          setExpandedModules(new Set([json.modules[0].id]));
          if (json.modules[0].lessons.length > 0) {
            setActiveLessonId(json.modules[0].lessons[0].id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [courseId, accessToken]);

  // Derived state
  const activeLesson = useMemo(() => {
    if (!data || !activeLessonId) return null;
    for (const mod of data.modules) {
      const lesson = mod.lessons.find(l => l.id === activeLessonId);
      if (lesson) return lesson;
    }
    return null;
  }, [data, activeLessonId]);

  const flatLessons = useMemo(() => {
    if (!data) return [];
    return data.modules.flatMap(m => m.lessons);
  }, [data]);

  const currentIndex = flatLessons.findIndex(l => l.id === activeLessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  // Handlers
  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || !accessToken || activeLesson.completed) return;

    try {
      setMarkingComplete(true);
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ lessonId: activeLesson.id })
      });

      if (!res.ok) throw new Error('Failed to update progress');

      // Update local state
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          modules: prev.modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => 
              l.id === activeLesson.id ? { ...l, completed: true } : l
            )
          }))
        };
      });
    } catch (err) {
      console.error('Error marking complete:', err);
    } finally {
      setMarkingComplete(false);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 p-8">
          <div className="w-16 h-16 border-2 border-black rounded-xl shadow-brutal flex items-center justify-center bg-brand">
            <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={2.5} />
          </div>
          <p className="font-display font-bold text-xl uppercase tracking-wide">Carregando curso...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black rounded-xl shadow-brutal p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-2 border-black rounded-xl shadow-brutal-sm bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={2.5} />
          </div>
          <h2 className="font-display font-bold text-2xl uppercase mb-2">Erro ao carregar</h2>
          <p className="font-body text-gray-600 mb-8">{error || 'Curso não encontrado'}</p>
          <Button variant="primary" onClick={() => navigate('/courses')} className="w-full">
            Voltar aos Cursos
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main Layout ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky Header */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-40">
        <div className="max-w-[clamp(960px,80vw,1600px)] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wide hover:text-brand transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          
          <div className="flex-1 min-w-0 text-center">
            <p className="text-[clamp(8px,1vw,10px)] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Curso</p>
            <h1 className="font-display font-bold text-sm sm:text-base md:text-lg truncate">
              {data.course.title}
            </h1>
          </div>
          
          <div className="w-12 sm:w-16 shrink-0" /> {/* Balance spacer */}
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden border-b-2 border-black flex">
        <button
          onClick={() => setMobileTab('content')}
          className={`flex-1 py-3.5 font-display font-bold uppercase text-xs tracking-widest transition-colors ${
            mobileTab === 'content' 
              ? 'bg-brand text-white shadow-[inset_0_clamp(1px,0.15vw,2px)_0_0_black]' 
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Aula Atual
        </button>
        <button
          onClick={() => setMobileTab('syllabus')}
          className={`flex-1 py-3.5 font-display font-bold uppercase text-xs tracking-widest border-l-2 border-black transition-colors ${
            mobileTab === 'syllabus' 
              ? 'bg-brand text-white shadow-[inset_0_clamp(1px,0.15vw,2px)_0_0_black]' 
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Ementa
        </button>
      </div>

      {/* Content Grid */}
      <div className="flex-1 max-w-[clamp(960px,80vw,1600px)] mx-auto w-full grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[calc(100vh-4rem)]">
        
        {/* ─── Sidebar (Syllabus) ─────────────────────────────────── */}
        <aside className={`
          bg-white overflow-y-auto lg:border-r-2 lg:border-black
          ${mobileTab === 'syllabus' ? 'block' : 'hidden lg:block'}
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b-2 border-black bg-emerald-50 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 border-2 border-black rounded-lg shadow-brutal-sm bg-brand flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm uppercase tracking-wide leading-none">Ementa</h2>
                <p className="text-[clamp(8px,1vw,10px)] font-bold uppercase tracking-widest text-gray-500 mt-1">
                  {flatLessons.filter(l => l.completed).length}/{flatLessons.length} concluídas
                </p>
              </div>
            </div>
          </div>

          {/* Module List */}
          <nav className="divide-y-2 divide-black">
            {data.modules.map((mod) => {
              const isExpanded = expandedModules.has(mod.id);
              const completedCount = mod.lessons.filter(l => l.completed).length;
              const totalCount = mod.lessons.length;
              const allDone = completedCount === totalCount && totalCount > 0;

              return (
                <div key={mod.id}>
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`
                      w-7 h-7 border-2 border-black rounded-lg shrink-0 flex items-center justify-center text-xs font-display font-bold
                      ${allDone ? 'bg-brand text-white' : 'bg-white text-black group-hover:bg-gray-100'}
                    `}>
                      {allDone ? <CheckCircle2 className="w-4 h-4" strokeWidth={3} /> : mod.orderIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-xs uppercase tracking-wide truncate">
                        {mod.title}
                      </p>
                      <p className="text-[clamp(8px,1vw,10px)] font-medium text-gray-400 mt-0.5">
                        {completedCount}/{totalCount} lições
                      </p>
                    </div>
                    {isExpanded 
                      ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2.5} />
                      : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2.5} />
                    }
                  </button>

                  {/* Lessons List */}
                  {isExpanded && (
                    <div className="bg-gray-50">
                      {mod.lessons.map((lesson) => {
                        const isActive = lesson.id === activeLessonId;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setActiveLessonId(lesson.id);
                              setMobileTab('content');
                            }}
                            className={`
                              w-full flex items-center gap-3 pl-4 pr-3 py-3 text-left transition-all border-l-4
                              ${isActive 
                                ? 'bg-brand border-brand text-white' 
                                : 'border-transparent hover:bg-gray-100 text-black'
                              }
                            `}
                          >
                            <div className="shrink-0 mt-0.5">
                              {lesson.completed ? (
                                <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand'}`} strokeWidth={2.5} />
                              ) : (
                                <PlayCircle className={`w-4 h-4 ${isActive ? 'text-white/70' : 'text-gray-300'}`} strokeWidth={2.5} />
                              )}
                            </div>
                            <p className={`text-xs font-medium truncate flex-1 ${isActive ? 'text-white' : 'text-gray-700'}`}>
                              {lesson.title}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ─── Main Content Area ──────────────────────────────────── */}
        <main className={`
          bg-white overflow-y-auto
          ${mobileTab === 'content' ? 'block' : 'hidden lg:block'}
        `}>
          {activeLesson ? (
            <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-10 space-y-8">
              
              {/* Video Player */}
              <div className="w-full aspect-video bg-black border-2 border-black rounded-xl shadow-brutal overflow-hidden relative">
                {activeLesson.videoUrl ? (
                  <iframe
                    src={activeLesson.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                    <div className="w-20 h-20 border-2 border-white/20 rounded-2xl flex items-center justify-center mb-4">
                      <PlayCircle className="w-10 h-10 text-white/40" strokeWidth={2} />
                    </div>
                    <p className="font-display font-bold text-lg uppercase tracking-wide">Vídeo indisponível</p>
                    <p className="font-body text-sm text-gray-500 mt-2 max-w-xs">O conteúdo de vídeo para esta aula ainda não foi carregado.</p>
                  </div>
                )}
              </div>

              {/* Lesson Header & Action */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b-2 border-black">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg border-2 border-black bg-emerald-50 text-[clamp(8px,1vw,10px)] font-bold uppercase tracking-widest shadow-brutal-sm">
                      Aula {currentIndex + 1} de {flatLessons.length}
                    </span>
                    {activeLesson.completed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 border-black bg-brand text-white text-[clamp(8px,1vw,10px)] font-bold uppercase tracking-widest shadow-brutal-sm">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
                        Concluída
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl leading-tight">
                    {activeLesson.title}
                  </h2>
                </div>

                <button
                  onClick={handleMarkComplete}
                  disabled={activeLesson.completed || markingComplete}
                  className={`
                    flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border-2 border-black 
                    font-display font-bold uppercase text-sm tracking-wide shadow-brutal brutal-interactive 
                    min-w-[clamp(140px,20vw,220px)] shrink-0
                    ${activeLesson.completed 
                      ? 'bg-emerald-50 text-brand cursor-default' 
                      : 'bg-brand text-white hover:bg-brand-light'
                    }
                    ${(markingComplete || activeLesson.completed) ? 'disabled:opacity-100 disabled:cursor-default disabled:transform-none disabled:shadow-none' : ''}
                  `}
                >
                  {markingComplete ? (
                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                  ) : activeLesson.completed ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                      Concluída
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                      Marcar Concluída
                    </>
                  )}
                </button>
              </div>

              {/* Lesson Content */}
              {activeLesson.content && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <FileText className="w-5 h-5 text-brand" strokeWidth={2.5} />
                    <h3 className="font-display font-bold text-lg uppercase tracking-wide">Material de Apoio</h3>
                  </div>
                  <div className="bg-emerald-50/50 border-2 border-black rounded-xl p-6 md:p-8">
                    <div className="prose prose-lg max-w-none font-body leading-relaxed text-gray-800 whitespace-pre-wrap">
                      {activeLesson.content}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="pt-6 flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
                  disabled={!prevLesson}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                  Anterior
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => nextLesson && setActiveLessonId(nextLesson.id)}
                  disabled={!nextLesson}
                  className="gap-2"
                >
                  Próxima
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </Button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[clamp(250px,40vw,400px)]">
              <div className="w-20 h-20 border-2 border-black rounded-2xl shadow-brutal bg-emerald-50 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-brand" strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-bold text-xl uppercase mb-2">Selecione uma aula</h3>
              <p className="font-body text-gray-500 max-w-xs">Escolha uma lição na barra lateral para começar a estudar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
