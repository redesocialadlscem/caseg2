import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Layers,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { apiFetch } from '../../lib/api';
import { useAuthContext } from '../../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Course {
  id: number;
  title: string;
  category: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface Module {
  id: number;
  title: string;
  order: number;
  lessonCount: number;
}

interface CourseFormData {
  title: string;
  category: string;
  description: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function AdminCoursesPage() {
  const { accessToken } = useAuthContext();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    category: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<CourseFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  // Modules state
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);

  // ─── Fetch Courses ───────────────────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/admin/courses', accessToken);
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar cursos');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Clear success message after 3s
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // ─── Course CRUD ─────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({ title: '', category: '', description: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      category: course.category,
      description: course.description,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<CourseFormData> = {};
    if (!formData.title.trim()) errors.title = 'Título é obrigatório';
    if (!formData.category.trim()) errors.category = 'Categoria é obrigatória';
    if (!formData.description.trim())
      errors.description = 'Descrição é obrigatória';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingCourse) {
        await apiFetch(`/api/admin/courses/${editingCourse.id}`, accessToken, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMsg('Curso atualizado com sucesso!');
      } else {
        await apiFetch('/api/admin/courses', accessToken, {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMsg('Curso criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar curso');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (course: Course) => {
    const action = course.isActive ? 'desativar' : 'ativar';
    if (!window.confirm(`Tem certeza que deseja ${action} "${course.title}"?`))
      return;

    try {
      if (course.isActive) {
        await apiFetch(`/api/admin/courses/${course.id}`, accessToken, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/admin/courses/${course.id}`, accessToken, {
          method: 'PUT',
          body: JSON.stringify({ isActive: true }),
        });
      }
      setSuccessMsg(
        `Curso ${course.isActive ? 'desativado' : 'ativado'} com sucesso!`,
      );
      fetchCourses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Falha ao ${action} curso`,
      );
    }
  };

  // ─── Modules ─────────────────────────────────────────────────────────────
  const toggleModules = async (courseId: number) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      setModules([]);
      return;
    }

    setExpandedCourseId(courseId);
    setModulesLoading(true);
    try {
      const res = await apiFetch(`/api/admin/courses/${courseId}/modules`, accessToken);
      const data = await res.json();
      setModules(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar módulos',
      );
    } finally {
      setModulesLoading(false);
    }
  };

  const addModule = async (courseId: number) => {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    try {
      await apiFetch(`/api/admin/courses/${courseId}/modules`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      });
      setNewModuleTitle('');
      setSuccessMsg('Módulo adicionado!');
      // Refresh modules
      const res = await apiFetch(`/api/admin/courses/${courseId}/modules`, accessToken);
      const data = await res.json();
      setModules(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao adicionar módulo',
      );
    } finally {
      setAddingModule(false);
    }
  };

  const deleteModule = async (moduleId: number, moduleTitle: string) => {
    if (
      !window.confirm(
        `Deletar módulo "${moduleTitle}" e todas as suas lições? Esta ação não pode ser desfeita.`,
      )
    )
      return;

    try {
      await apiFetch(`/api/admin/modules/${moduleId}`, accessToken, { method: 'DELETE' });
      setSuccessMsg('Módulo deletado!');
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao deletar módulo',
      );
    }
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
              <Link to="/admin" className="hover:text-brand transition-colors">
                Admin
              </Link>
              <ChevronRight size={14} />
              <span className="text-black">Cursos</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl flex items-center gap-3">
              <BookOpen className="text-brand" size={36} />
              Gestão de Cursos
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
              Novo Curso
            </Button>
          </div>
        </header>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 rounded-xl shadow-brutal-sm flex items-center gap-3">
            <AlertCircle className="text-red-600 shrink-0" size={20} />
            <p className="text-sm font-bold text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border-2 border-brand rounded-xl shadow-brutal-sm flex items-center gap-3">
            <CheckCircle2 className="text-brand shrink-0" size={20} />
            <p className="text-sm font-bold text-brand">{successMsg}</p>
            <button
              onClick={() => setSuccessMsg(null)}
              className="ml-auto text-brand hover:text-green-900"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Courses List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border-2 border-black rounded-xl p-6 bg-white shadow-brutal animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="text-center py-16">
            <BookOpen
              className="mx-auto text-gray-300 mb-4"
              size={48}
              strokeWidth={1.5}
            />
            <h3 className="font-display font-bold text-xl mb-2">
              Nenhum curso cadastrado
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando o primeiro curso da plataforma.
            </p>
            <Button onClick={openCreateModal} className="gap-2">
              <Plus size={18} strokeWidth={3} />
              Criar Primeiro Curso
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id}>
                <Card className="!p-0 overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display font-bold text-lg sm:text-xl truncate">
                            {course.title}
                          </h3>
                          <span
                            className={`shrink-0 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide border-2 border-black rounded-md ${
                              course.isActive
                                ? 'bg-brand text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {course.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                          <span className="font-bold text-brand uppercase tracking-wide text-xs">
                            {course.category}
                          </span>
                          <span>•</span>
                          <span>
                            Criado em{' '}
                            {new Date(course.createdAt).toLocaleDateString(
                              'pt-BR',
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {course.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleModules(course.id)}
                          className="gap-1.5"
                          title="Gerenciar Módulos"
                        >
                          <Layers size={16} />
                          <span className="hidden sm:inline">Módulos</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(course)}
                          title="Editar Curso"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant={course.isActive ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => toggleActive(course)}
                          title={course.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {course.isActive ? (
                            <Trash2 size={16} />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Modules Section */}
                  {expandedCourseId === course.id && (
                    <div className="border-t-2 border-black bg-emerald-50/50 p-5 sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FolderOpen className="text-brand" size={20} />
                        <h4 className="font-display font-bold text-base uppercase tracking-wide">
                          Módulos do Curso
                        </h4>
                      </div>

                      {modulesLoading ? (
                        <div className="flex items-center gap-3 py-6 justify-center">
                          <Loader2 className="animate-spin text-brand" size={20} />
                          <span className="text-sm font-bold text-gray-500">
                            Carregando módulos...
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Module List */}
                          {modules.length > 0 ? (
                            <div className="space-y-2 mb-4">
                              {modules.map((mod) => (
                                <div
                                  key={mod.id}
                                  className="flex items-center justify-between bg-white border-2 border-black rounded-xl px-4 py-3 shadow-brutal-sm"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="shrink-0 w-7 h-7 flex items-center justify-center bg-brand text-white text-xs font-bold border-2 border-black rounded-md">
                                      {mod.order + 1}
                                    </span>
                                    <span className="font-bold text-sm truncate">
                                      {mod.title}
                                    </span>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                      ({mod.lessonCount}{' '}
                                      {mod.lessonCount === 1
                                        ? 'lição'
                                        : 'lições'}
                                      )
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      deleteModule(mod.id, mod.title)
                                    }
                                    className="shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Deletar Módulo"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mb-4 italic">
                              Nenhum módulo cadastrado ainda.
                            </p>
                          )}

                          {/* Add Module Form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newModuleTitle}
                              onChange={(e) =>
                                setNewModuleTitle(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addModule(course.id);
                              }}
                              placeholder="Nome do novo módulo..."
                              className="flex-1 bg-white border-2 border-black rounded-xl px-4 py-2.5 text-sm font-body placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow"
                            />
                            <Button
                              size="sm"
                              onClick={() => addModule(course.id)}
                              disabled={!newModuleTitle.trim() || addingModule}
                              className="gap-1.5"
                            >
                              {addingModule ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Plus size={16} strokeWidth={3} />
                              )}
                              <span className="hidden sm:inline">
                                Adicionar
                              </span>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── Create/Edit Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white border-2 border-black rounded-xl shadow-brutal p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl">
                {editingCourse ? 'Editar Curso' : 'Novo Curso'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Título do Curso"
                placeholder="Ex: NR-10 Segurança em Eletricidade"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                error={formErrors.title}
                autoFocus
              />

              <Input
                label="Categoria"
                placeholder="Ex: NR-10, NR-35, EPIs"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                error={formErrors.category}
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label
                  htmlFor="description"
                  className="font-display font-bold text-xs uppercase tracking-wide mb-2 block"
                >
                  Descrição
                </label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Descreva o conteúdo e objetivos do curso..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={`w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-body text-base placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow resize-none ${
                    formErrors.description
                      ? 'border-red-600 focus:ring-red-600/30 focus:border-red-600'
                      : ''
                  }`}
                />
                {formErrors.description && (
                  <span className="text-red-600 text-sm font-medium mt-1">
                    {formErrors.description}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Salvando...
                  </>
                ) : editingCourse ? (
                  'Atualizar Curso'
                ) : (
                  'Criar Curso'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
