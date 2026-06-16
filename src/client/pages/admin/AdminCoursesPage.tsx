import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Layers,
  Video,
  FileText,
  ClipboardList,
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
  imageUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  price: number;
  durationHours: number;
  createdAt: string;
  updatedAt: string;
}

interface Module {
  id: number;
  title: string;
  order: number;
  lessonCount: number;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  videoUrl: string;
  order: number;
}

interface CourseFormData {
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  isFeatured: boolean;
  price: number;
  durationHours: number;
  updatedAt: string; // yyyy-mm-dd
}

/** Converte um timestamp/data ISO em yyyy-mm-dd para o input date. */
function toDateInput(value?: string | number | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
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
    imageUrl: '',
    isFeatured: false,
    price: 0,
    durationHours: 0,
    updatedAt: toDateInput(),
  });
  const [formErrors, setFormErrors] = useState<Partial<CourseFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  // Modules state
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);

  // Lessons (conteúdo) state
  const navigate = useNavigate();
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  const [moduleLessons, setModuleLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '' });
  const [savingLesson, setSavingLesson] = useState(false);

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
  }, [accessToken]);

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
    setFormData({ title: '', category: '', description: '', imageUrl: '', isFeatured: false, price: 0, durationHours: 0, updatedAt: toDateInput() });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      category: course.category,
      description: course.description,
      imageUrl: course.imageUrl || '',
      isFeatured: course.isFeatured || false,
      price: course.price ?? 0,
      durationHours: course.durationHours ?? 0,
      updatedAt: toDateInput(course.updatedAt),
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
      if (expandedModuleId === moduleId) { setExpandedModuleId(null); setModuleLessons([]); }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao deletar módulo',
      );
    }
  };

  // ─── Lições (conteúdo) ─────────────────────────────────────────────────────
  const reloadModules = async (courseId: number) => {
    try {
      const res = await apiFetch(`/api/admin/courses/${courseId}/modules`, accessToken);
      setModules(await res.json());
    } catch { /* ignore */ }
  };

  const loadLessons = async (moduleId: number) => {
    const res = await apiFetch(`/api/admin/modules/${moduleId}/lessons`, accessToken);
    setModuleLessons(await res.json());
  };

  const toggleLessons = async (moduleId: number) => {
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null);
      setModuleLessons([]);
      return;
    }
    setExpandedModuleId(moduleId);
    setModuleLessons([]);
    setLessonsLoading(true);
    try {
      await loadLessons(moduleId);
    } catch {
      setError('Falha ao carregar lições');
    } finally {
      setLessonsLoading(false);
    }
  };

  const openCreateLesson = (moduleId: number) => {
    setEditingLesson(null);
    setLessonModuleId(moduleId);
    setLessonForm({ title: '', videoUrl: '', content: '' });
    setLessonModalOpen(true);
  };

  const openEditLesson = (lesson: Lesson, moduleId: number) => {
    setEditingLesson(lesson);
    setLessonModuleId(moduleId);
    setLessonForm({ title: lesson.title, videoUrl: lesson.videoUrl || '', content: lesson.content || '' });
    setLessonModalOpen(true);
  };

  const saveLesson = async () => {
    if (!lessonForm.title.trim() || lessonModuleId == null) return;
    setSavingLesson(true);
    try {
      const body = JSON.stringify({
        title: lessonForm.title.trim(),
        videoUrl: lessonForm.videoUrl.trim(),
        content: lessonForm.content,
      });
      if (editingLesson) {
        await apiFetch(`/api/admin/lessons/${editingLesson.id}`, accessToken, { method: 'PUT', body });
        setSuccessMsg('Lição atualizada!');
      } else {
        await apiFetch(`/api/admin/modules/${lessonModuleId}/lessons`, accessToken, { method: 'POST', body });
        setSuccessMsg('Lição adicionada!');
      }
      setLessonModalOpen(false);
      await loadLessons(lessonModuleId);
      if (expandedCourseId) await reloadModules(expandedCourseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar lição');
    } finally {
      setSavingLesson(false);
    }
  };

  const deleteLesson = async (lesson: Lesson, moduleId: number) => {
    if (!window.confirm(`Deletar a lição "${lesson.title}"?`)) return;
    try {
      await apiFetch(`/api/admin/lessons/${lesson.id}`, accessToken, { method: 'DELETE' });
      setSuccessMsg('Lição deletada!');
      setModuleLessons((prev) => prev.filter((l) => l.id !== lesson.id));
      if (expandedCourseId) await reloadModules(expandedCourseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao deletar lição');
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
                          {course.isFeatured && (
                            <span className="shrink-0 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide border-2 border-black rounded-md bg-yellow-400 text-black">
                              ⭐ Destaque
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                          <span className="font-bold text-brand uppercase tracking-wide text-xs">
                            {course.category}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-black">
                            {course.price > 0
                              ? course.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                              : 'Gratuito'}
                          </span>
                          <span>•</span>
                          <span>{course.durationHours > 0 ? `${course.durationHours}h` : 'sem carga horária'}</span>
                          <span>•</span>
                          <span className="font-bold text-gray-700">
                            Atualizado em {new Date(course.updatedAt).toLocaleDateString('pt-BR')}
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
                                <div key={mod.id} className="bg-white border-2 border-black rounded-xl shadow-brutal-sm overflow-hidden">
                                  {/* Cabeçalho do módulo (clique expande as lições) */}
                                  <div className="flex items-center justify-between px-4 py-3">
                                    <button
                                      onClick={() => toggleLessons(mod.id)}
                                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                                    >
                                      {expandedModuleId === mod.id
                                        ? <ChevronDown size={16} className="shrink-0 text-brand" strokeWidth={2.5} />
                                        : <ChevronRight size={16} className="shrink-0 text-gray-400" strokeWidth={2.5} />}
                                      <span className="shrink-0 w-7 h-7 flex items-center justify-center bg-brand text-white text-xs font-bold border-2 border-black rounded-md">
                                        {mod.order + 1}
                                      </span>
                                      <span className="font-bold text-sm truncate">{mod.title}</span>
                                      <span className="text-xs text-gray-500 whitespace-nowrap">
                                        ({mod.lessonCount} {mod.lessonCount === 1 ? 'lição' : 'lições'})
                                      </span>
                                    </button>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => openCreateLesson(mod.id)}
                                        className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-brand px-2 py-1 text-[11px] font-bold uppercase text-white shadow-brutal-sm hover:bg-brand-light"
                                        title="Adicionar lição"
                                      >
                                        <Plus size={12} strokeWidth={3} /> Lição
                                      </button>
                                      <button
                                        onClick={() => deleteModule(mod.id, mod.title)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Deletar Módulo"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Lições do módulo */}
                                  {expandedModuleId === mod.id && (
                                    <div className="border-t-2 border-dashed border-gray-200 bg-gray-50/60 px-4 py-3">
                                      {lessonsLoading ? (
                                        <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                                          <Loader2 className="animate-spin text-brand" size={16} /> Carregando lições…
                                        </div>
                                      ) : moduleLessons.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic py-1">Nenhuma lição neste módulo. Clique em "Lição" para adicionar conteúdo.</p>
                                      ) : (
                                        <ul className="space-y-2">
                                          {moduleLessons.map((lesson, i) => (
                                            <li key={lesson.id} className="flex items-center justify-between gap-2 bg-white border-2 border-black rounded-lg px-3 py-2">
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className="shrink-0 text-xs font-mono font-bold text-gray-400">{i + 1}.</span>
                                                <span className="font-medium text-sm truncate">{lesson.title}</span>
                                                <span className="flex items-center gap-1.5 shrink-0">
                                                  {lesson.videoUrl && <Video size={13} className="text-brand" />}
                                                  {lesson.content && <FileText size={13} className="text-gray-400" />}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-emerald-50 rounded-lg transition-colors" title="Provas e atividades">
                                                  <ClipboardList size={15} />
                                                </button>
                                                <button onClick={() => openEditLesson(lesson, mod.id)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-emerald-50 rounded-lg transition-colors" title="Editar conteúdo">
                                                  <Pencil size={15} />
                                                </button>
                                                <button onClick={() => deleteLesson(lesson, mod.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Deletar lição">
                                                  <Trash2 size={15} />
                                                </button>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
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

              <Input
                label="URL da Imagem de Capa"
                placeholder="https://images.unsplash.com/..."
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
              />

              {/* Conformidade NR: carga horária + última atualização do conteúdo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="durationHours" className="font-display font-bold text-xs uppercase tracking-wide mb-2 block">Carga horária (h)</label>
                  <input
                    id="durationHours"
                    type="number"
                    min={0}
                    step="0.5"
                    inputMode="decimal"
                    placeholder="Ex: 8"
                    value={Number.isFinite(formData.durationHours) ? formData.durationHours : 0}
                    onChange={(e) => setFormData((prev) => ({ ...prev, durationHours: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-body text-base focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="updatedAt" className="font-display font-bold text-xs uppercase tracking-wide mb-2 block">Última atualização</label>
                  <input
                    id="updatedAt"
                    type="date"
                    value={formData.updatedAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, updatedAt: e.target.value }))}
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-body text-base focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">Data de revisão do conteúdo (conformidade com a versão vigente da NR). Atualiza sozinho ao editar módulos/lições.</p>

              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="price" className="font-display font-bold text-xs uppercase tracking-wide mb-2 block">
                  Valor (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 pointer-events-none">R$</span>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={Number.isFinite(formData.price) ? formData.price : 0}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: Math.max(0, parseFloat(e.target.value) || 0) }))
                    }
                    className="w-full bg-white border-2 border-black rounded-xl pl-11 pr-4 py-3 font-body text-base focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow"
                  />
                </div>
                <span className="text-xs text-gray-500">Deixe <strong>0</strong> para um curso gratuito.</span>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none p-3 border-2 border-black rounded-xl bg-white hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                  }
                  className="w-5 h-5 accent-brand border-2 border-black rounded"
                />
                <span className="font-display font-bold text-sm uppercase tracking-wide">
                  ⭐ Curso em Destaque
                </span>
              </label>

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

      {/* Modal: criar/editar conteúdo da lição */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setLessonModalOpen(false)} />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border-2 border-black rounded-xl shadow-brutal p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl">{editingLesson ? 'Editar Lição' : 'Nova Lição'}</h2>
              <button onClick={() => setLessonModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <Input
                label="Título da Lição"
                placeholder="Ex: Introdução à NR-35"
                value={lessonForm.title}
                onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
              />
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-xs uppercase tracking-wide mb-1 block">URL do Vídeo (opcional)</label>
                <Input
                  placeholder="https://www.youtube.com/embed/... ou link do vídeo"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))}
                />
                <span className="text-xs text-gray-500">Cole o link do vídeo (YouTube, Vimeo, etc.). Deixe vazio se a lição for só texto.</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lesson-content" className="font-display font-bold text-xs uppercase tracking-wide mb-1 block">Conteúdo / Texto da Aula</label>
                <textarea
                  id="lesson-content"
                  rows={8}
                  placeholder="Escreva o conteúdo da lição (texto, instruções, resumo...)."
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-body text-base placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand transition-shadow resize-y"
                />
              </div>
              {editingLesson && (
                <button
                  onClick={() => { setLessonModalOpen(false); navigate(`/admin/lessons/${editingLesson.id}/edit`); }}
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
                >
                  <ClipboardList size={15} /> Configurar provas e atividades desta lição →
                </button>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setLessonModalOpen(false)} className="flex-1" disabled={savingLesson}>Cancelar</Button>
              <Button onClick={saveLesson} disabled={savingLesson || !lessonForm.title.trim()} className="flex-1 gap-2">
                {savingLesson ? (<><Loader2 className="animate-spin" size={18} /> Salvando…</>) : editingLesson ? 'Atualizar Lição' : 'Adicionar Lição'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
