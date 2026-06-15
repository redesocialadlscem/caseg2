import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { CourseCard } from '../components/CourseCard';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Search, Filter, BookOpen, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';

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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const categories = ['Todos', 'Normas Regulamentadoras', 'Gestão de Segurança', 'Emergências', 'Saúde Ocupacional', 'Meio Ambiente'];

export function CoursesPage() {
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

  // Category counts from current fetched data (client-side approximation)
  const getCategoryCount = (cat: string) => {
    if (cat === 'Todos') return total;
    return courses.filter((c) => c.category === cat).length;
  };

  return (
    <PublicLayout>
      <div className="rounded-[2rem] border-2 border-black bg-[linear-gradient(180deg,_#ffffff,_#ecfdf5)] p-6 shadow-brutal">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1.6fr_0.9fr] items-center">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-brand">Catálogo de Treinamentos</p>
            <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold uppercase tracking-tight leading-tight">
              Cursos profissionais de segurança do trabalho
            </h1>
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
                <p className="font-display font-bold text-3xl text-black">
                  {loading ? '...' : total}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-8">
          <aside className="space-y-6">
            <Card className="border-2 border-black rounded-xl bg-white p-6 shadow-brutal">
              <h2 className="font-display font-bold text-xl uppercase tracking-tight mb-4">Áreas de SST</h2>
              <div className="space-y-3">
                {categories.map((cat) => {
                  const count = getCategoryCount(cat);
                  return (
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
                      {!loading && (
                        <span className="ml-2 text-xs font-medium text-gray-500">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="border-2 border-black rounded-xl bg-white p-6 shadow-brutal">
              <h2 className="font-display font-bold text-xl uppercase tracking-tight mb-4">Dica rápida</h2>
              <p className="font-body text-sm text-gray-600 leading-relaxed">
                Use a busca e os filtros por área para encontrar cursos alinhados à norma e à sua rotina de trabalho.
              </p>
            </Card>
          </aside>

          <section>
            <div className="mb-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-display font-bold uppercase tracking-tighter leading-[0.95]">
                    Catálogo de <span className="text-brand">Cursos</span>
                  </h1>
                  <p className="font-body text-gray-600 mt-3 text-base sm:text-lg max-w-2xl leading-relaxed">
                    Filtre por área de segurança do trabalho e refine com a busca para encontrar o treinamento certo.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen size={18} className="text-brand" strokeWidth={2.5} />
                  <p className="font-body text-sm font-medium text-gray-500">
                    {loading ? 'Carregando...' : `${total} ${total === 1 ? 'curso encontrado' : 'cursos encontrados'}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.4fr] gap-6 mb-8">
              <div>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    strokeWidth={2.5}
                  />
                  <Input
                    placeholder="Buscar curso..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(''); setActiveCategory('Todos'); }}
                  className="w-full"
                >
                  Limpar filtros
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveCategory('Todos')}
                  className="w-full"
                >
                  Mostrar tudo
                </Button>
              </div>
            </div>

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
                <Button variant="outline" size="sm" className="mt-6" onClick={fetchCourses}>
                  Tentar novamente
                </Button>
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
                <h3 className="font-display font-bold text-lg uppercase text-black">
                  Nenhum curso encontrado
                </h3>
                <p className="font-body text-sm text-gray-600 mt-2">
                  Ajuste os filtros ou a busca para ampliar os resultados.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6"
                  onClick={() => { setSearch(''); setActiveCategory('Todos'); }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
