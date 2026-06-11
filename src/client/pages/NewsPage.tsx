import { useState, useEffect } from 'react';
import { Newspaper, Calendar, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/PublicLayout';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function NewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news?page=${page}&limit=${limit}`)
      .then((res) => (res.ok ? res.json() : { news: [], total: 0 }))
      .then((data) => {
        setNewsList(data.news ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-white font-body text-black">
      <PublicHeader />
      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 border-b-2 border-black bg-emerald-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white border-2 border-black rounded-xl shadow-brutal-sm">
              <Newspaper size={16} className="text-brand" />
              <span className="font-display font-bold text-xs uppercase tracking-widest text-brand">
                Notícias e Atualizações
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-[1.05] mb-4">
              Segurança do Trabalho em <span className="text-brand">Destaque</span>
            </h1>
            <p className="font-body text-lg text-gray-700 max-w-2xl mx-auto">
              Fique por dentro das últimas novidades, normas regulamentadoras e atualizações do setor de segurança do trabalho.
            </p>
          </div>
        </section>

        {/* News Grid */}
        <section className="py-16 border-b-2 border-black">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border-2 border-black bg-white p-6 shadow-brutal animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : newsList.length === 0 ? (
              <div className="text-center py-16">
                <Newspaper className="mx-auto text-gray-300 mb-4" size={48} strokeWidth={1.5} />
                <h3 className="font-display font-bold text-xl mb-2">Nenhuma notícia disponível</h3>
                <p className="text-gray-500">Em breve publicaremos novidades por aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {newsList.map((item) => (
                  <Card key={item.id} className="flex flex-col h-full brutal-interactive">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
                      <Calendar size={14} />
                      {formatDate(item.publishedAt)}
                    </div>
                    <h3 className="font-display font-bold text-xl uppercase mb-3 leading-tight">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="font-body text-sm text-gray-600 leading-relaxed mb-4 flex-1">
                        {item.summary}
                      </p>
                    )}
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-display font-bold text-sm text-brand hover:text-black transition-colors mt-auto"
                      >
                        <ExternalLink size={14} />
                        Ler mais
                      </a>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="font-display font-bold text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="bg-gray-900 text-white border-t-4 border-brand">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display font-bold text-xl mb-2">CASEG Protege</h3>
              <p className="font-body text-sm text-gray-400">Capacitando profissionais com excelência em segurança do trabalho.</p>
            </div>
            <div className="flex gap-6">
              <Link to="/" className="font-body text-sm text-gray-400 hover:text-brand transition-colors">Início</Link>
              <Link to="/courses" className="font-body text-sm text-gray-400 hover:text-brand transition-colors">Cursos</Link>
              <Link to="/news" className="font-body text-sm text-gray-400 hover:text-brand transition-colors">Notícias</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center font-body text-sm text-gray-500">
            © 2024 CASEG Protege. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
