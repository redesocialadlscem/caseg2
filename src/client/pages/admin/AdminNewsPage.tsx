import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Search,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { apiFetch } from '../../lib/api';
import { useAuthContext } from '../../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────
interface NewsItem {
  id: number;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
}

interface NewsFormData {
  title: string;
  summary: string;
  sourceUrl: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function AdminNewsPage() {
  const { accessToken } = useAuthContext();

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState<NewsFormData>({ title: '', summary: '', sourceUrl: '' });
  const [formErrors, setFormErrors] = useState<Partial<NewsFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch News ──────────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await apiFetch(`/api/admin/news?${params}`, accessToken);
      const data = await res.json();
      setNewsList(data.news ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar notícias');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, page, debouncedSearch]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const totalPages = Math.ceil(total / limit);

  // ─── CRUD ────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingNews(null);
    setFormData({ title: '', summary: '', sourceUrl: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingNews(item);
    setFormData({ title: item.title, summary: item.summary ?? '', sourceUrl: item.sourceUrl ?? '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewsFormData> = {};
    if (!formData.title.trim()) errors.title = 'Título é obrigatório';
    if (formData.sourceUrl && !/^https?:\/\/.+/i.test(formData.sourceUrl)) {
      errors.sourceUrl = 'URL inválida';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingNews) {
        await apiFetch(`/api/admin/news/${editingNews.id}`, accessToken, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMsg('Notícia atualizada com sucesso!');
      } else {
        await apiFetch('/api/admin/news', accessToken, {
          method: 'POST',
          body: JSON.stringify({ ...formData, publishedAt: new Date().toISOString() }),
        });
        setSuccessMsg('Notícia criada com sucesso!');
      }
      setIsModalOpen(false);
      fetchNews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar notícia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Deletar a notícia "${title}"?`)) return;
    try {
      await apiFetch(`/api/admin/news/${id}`, accessToken, { method: 'DELETE' });
      setSuccessMsg('Notícia deletada!');
      fetchNews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao deletar notícia');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
              <Link to="/admin" className="hover:text-black transition-colors">Admin</Link>
              <ChevronRight size={14} />
              <span className="text-black">Notícias</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl flex items-center gap-3">
              <Newspaper className="text-brand" size={36} />
              Notícias e Publicações
            </h1>
          </div>
          <div className="flex gap-3">
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                Dashboard
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Button onClick={openCreateModal} size="sm" className="gap-2">
              <Plus size={18} strokeWidth={3} />
              Nova Notícia
            </Button>
          </div>
        </header>

        {/* Feedback */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 rounded-xl shadow-brutal-sm flex items-center gap-3">
            <AlertCircle className="text-red-600 shrink-0" size={20} />
            <p className="text-sm font-bold text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X size={16} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border-2 border-brand rounded-xl shadow-brutal-sm flex items-center gap-3">
            <CheckCircle2 className="text-brand shrink-0" size={20} />
            <p className="text-sm font-bold text-brand">{successMsg}</p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 max-w-md">
          <Input
            placeholder="Buscar notícias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="!py-2.5 !text-sm"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-black rounded-xl p-6 bg-white shadow-brutal animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : newsList.length === 0 ? (
          <Card className="text-center py-16">
            <Newspaper className="mx-auto text-gray-300 mb-4" size={48} strokeWidth={1.5} />
            <h3 className="font-display font-bold text-xl mb-2">Nenhuma notícia</h3>
            <p className="text-gray-500 mb-6">Comece criando a primeira notícia da plataforma.</p>
            <Button onClick={openCreateModal} className="gap-2">
              <Plus size={18} strokeWidth={3} />
              Criar Primeira Notícia
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {newsList.map((item) => (
              <Card key={item.id} className="!p-0 overflow-hidden">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-bold text-lg sm:text-xl truncate">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(item.publishedAt)}
                        </span>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-brand hover:text-black transition-colors"
                          >
                            <ExternalLink size={14} />
                            Fonte
                          </a>
                        )}
                      </div>
                      {item.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">{item.summary}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(item)} title="Editar">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(item.id, item.title)} title="Deletar">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 font-bold">
              Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Anterior
              </Button>
              <span className="flex items-center px-3 text-sm font-bold">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próximo
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border-2 border-black rounded-xl shadow-brutal p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl">
                {editingNews ? 'Editar Notícia' : 'Nova Notícia'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Título"
                placeholder="Ex: Nova atualização da NR-18"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                error={formErrors.title}
                autoFocus
              />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-display font-bold text-xs uppercase tracking-wide mb-2 block">Resumo</label>
                <textarea
                  rows={4}
                  placeholder="Resumo da notícia..."
                  value={formData.summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-body text-base placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow resize-none"
                />
              </div>
              <Input
                label="URL da Fonte (opcional)"
                placeholder="https://exemplo.com/noticia"
                value={formData.sourceUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                error={formErrors.sourceUrl}
              />
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1" disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2">
                {submitting ? (
                  <><Loader2 className="animate-spin" size={18} /> Salvando...</>
                ) : editingNews ? 'Atualizar' : 'Criar Notícia'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
