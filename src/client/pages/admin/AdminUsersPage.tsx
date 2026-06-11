import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Search,
  ChevronRight,
  ArrowRight,
  Eye,
  UserX,
  UserCheck,
  RefreshCw,
  Award,
  BookOpen,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAdminUsers, type AdminUser } from '../../hooks/useAdminUsers';
import { useAuthContext } from '../../context/AuthContext';

// --- TYPES ---
type UserRole = 'student' | 'admin';
type UserStatus = 'active' | 'inactive';

interface UserProgress {
  courseName: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

interface UserCertificate {
  courseName: string;
  issuedAt: string;
}

// --- COMPONENTS ---

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wide border-2 border-black ${
        role === 'admin'
          ? 'bg-brand text-white'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      {role === 'admin' ? 'Admin' : 'Aluno'}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wide border-2 border-black ${
        status === 'active'
          ? 'bg-emerald-100 text-emerald-900'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          status === 'active' ? 'bg-emerald-600' : 'bg-gray-400'
        }`}
      />
      {status === 'active' ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-black text-white border-2 border-black shadow-brutal px-6 py-4 flex items-center gap-3 max-w-sm">
        <ShieldCheck className="text-brand-light shrink-0" size={20} />
        <p className="font-display font-bold text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userCertificates, setUserCertificates] = useState<UserCertificate[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Debounce search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  }, []);

  const { accessToken } = useAuthContext();

  const { users, total, page, limit, loading, error, setPage, refetch, toggleRole, toggleStatus } =
    useAdminUsers({ search: debouncedSearch || undefined });

  // Stats derived from current page data (approximation for real API)
  const stats = useMemo(() => {
    const totalStudents = users.filter((u) => u.role === 'student').length;
    const totalAdmins = users.filter((u) => u.role === 'admin').length;
    const activeUsers = users.filter((u) => u.isActive).length;
    return [
      { label: 'Total na Página', value: users.length.toString(), icon: Users },
      { label: 'Administradores', value: totalAdmins.toString(), icon: ShieldCheck },
      { label: 'Usuários Ativos', value: activeUsers.toString(), icon: UserCheck },
      { label: 'Total no Sistema', value: total.toString(), icon: Award },
    ];
  }, [users, total]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleRole = async (user: AdminUser) => {
    setActionLoading(user.id);
    const newRole = user.role === 'student' ? 'admin' : 'student';
    const success = await toggleRole(user.id, newRole);
    if (success) {
      showToast(`Papel de ${user.name} alterado para ${newRole === 'admin' ? 'Administrador' : 'Aluno'}`);
    } else {
      showToast('Erro ao alterar papel do usuário');
    }
    setActionLoading(null);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    setActionLoading(user.id);
    const newStatus = !user.isActive;
    const success = await toggleStatus(user.id, newStatus);
    if (success) {
      showToast(`${user.name} foi ${newStatus ? 'ativado' : 'desativado'} com sucesso`);
    } else {
      showToast('Erro ao alterar status do usuário');
    }
    setActionLoading(null);
  };

  // Fetch user progress and certificates when modal opens
  useEffect(() => {
    if (!selectedUser || !accessToken) return;
    setModalLoading(true);
    setUserProgress([]);
    setUserCertificates([]);

    let cancelled = false;
    Promise.all([
      fetch(`/api/admin/users/${selectedUser.id}/progress`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/admin/users/${selectedUser.id}/certificates`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([progressData, certsData]) => {
        if (cancelled) return;
        if (Array.isArray(progressData)) setUserProgress(progressData);
        if (Array.isArray(certsData)) setUserCertificates(certsData);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setModalLoading(false); });

    return () => { cancelled = true; };
  }, [selectedUser, accessToken]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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
              <span className="text-black">Usuários</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl flex items-center gap-3">
              <Users className="text-brand" size={36} />
              Gestão de Usuários
            </h1>
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              Voltar ao Dashboard
              <ArrowRight size={16} />
            </Button>
          </Link>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 flex items-start justify-between group">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  {stat.label}
                </p>
                <p className="font-display font-bold text-4xl text-black">
                  {loading ? '-' : stat.value}
                </p>
              </div>
              <div className="bg-brand text-white p-3 rounded-full border-2 border-black shadow-brutal-sm group-hover:scale-110 transition-transform">
                <stat.icon size={24} strokeWidth={2.5} />
              </div>
            </Card>
          ))}
        </section>

        {/* Search & Table */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display font-bold text-xl uppercase tracking-wide">
              Todos os Usuários
            </h2>
            <div className="w-full sm:w-80 relative">
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="!py-2.5 !text-sm"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 border-2 border-red-500 bg-red-50 flex items-center gap-3">
              <AlertCircle className="text-red-600 shrink-0" size={20} />
              <p className="text-sm font-bold text-red-800">{error}</p>
              <button onClick={refetch} className="ml-auto text-xs font-bold underline text-red-700 hover:text-red-900">
                Tentar novamente
              </button>
            </div>
          )}

          <div className="border-2 border-black rounded-xl shadow-brutal overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand text-white border-b-2 border-black">
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">Nome</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden md:table-cell">Email</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">Papel</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden lg:table-cell">Cadastro</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">Status</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <Loader2 size={40} className="animate-spin" />
                          <p className="font-display font-bold text-lg">Carregando usuários...</p>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <Search size={40} strokeWidth={1.5} />
                          <p className="font-display font-bold text-lg">Nenhum usuário encontrado</p>
                          <p className="text-sm">Tente ajustar sua busca ou filtros.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isLoading = actionLoading === user.id;
                      const status: UserStatus = user.isActive ? 'active' : 'inactive';
                      return (
                        <tr
                          key={user.id}
                          className="border-b-2 border-black last:border-none hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4 font-bold text-sm">{user.name}</td>
                          <td className="p-4 text-sm text-gray-600 hidden md:table-cell max-w-[clamp(150px,22vw,250px)] truncate">
                            {user.email}
                          </td>
                          <td className="p-4">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="p-4 text-sm text-gray-500 hidden lg:table-cell whitespace-nowrap">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="p-4">
                            <StatusBadge status={status} />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedUser(user)}
                                title="Ver Detalhes"
                                className="p-2 border-2 border-black bg-white hover:bg-emerald-50 brutal-interactive disabled:opacity-50"
                                disabled={isLoading}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleRole(user)}
                                title="Trocar Papel"
                                className="p-2 border-2 border-black bg-white hover:bg-blue-50 brutal-interactive disabled:opacity-50"
                                disabled={isLoading}
                              >
                                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user)}
                                title={user.isActive ? 'Desativar' : 'Ativar'}
                                className={`p-2 border-2 border-black brutal-interactive disabled:opacity-50 ${
                                  user.isActive
                                    ? 'bg-white hover:bg-red-50 text-red-600'
                                    : 'bg-white hover:bg-green-50 text-green-600'
                                }`}
                                disabled={isLoading}
                              >
                                {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {total > (limit ?? 20) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500 font-bold">
                Mostrando {((page ?? 1) - 1) * (limit ?? 20) + 1}–{Math.min((page ?? 1) * (limit ?? 20), total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={(page ?? 1) <= 1} onClick={() => setPage((page ?? 1) - 1)}>
                  Anterior
                </Button>
                <span className="flex items-center px-3 text-sm font-bold">{page ?? 1} / {Math.ceil(total / (limit ?? 20))}</span>
                <Button variant="outline" size="sm" disabled={(page ?? 1) >= Math.ceil(total / (limit ?? 20))} onClick={() => setPage((page ?? 1) + 1)}>
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedUser(null)}
          />
          <div className="relative bg-white border-2 border-black shadow-brutal rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b-2 border-black p-6 flex items-start justify-between z-10">
              <div>
                <h2 className="font-display font-bold text-2xl mb-1">{selectedUser.name}</h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 border-2 border-black bg-white hover:bg-gray-100 brutal-interactive"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-8">
              {/* User Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 border-2 border-black bg-gray-50">
                  <p className="text-[clamp(8px,1vw,10px)] font-bold uppercase tracking-widest text-gray-500 mb-1">Papel</p>
                  <RoleBadge role={selectedUser.role} />
                </div>
                <div className="p-3 border-2 border-black bg-gray-50">
                  <p className="text-[clamp(8px,1vw,10px)] font-bold uppercase tracking-widest text-gray-500 mb-1">Status</p>
                  <StatusBadge status={selectedUser.isActive ? 'active' : 'inactive'} />
                </div>
                <div className="p-3 border-2 border-black bg-gray-50 col-span-2 sm:col-span-2">
                  <p className="text-[clamp(8px,1vw,10px)] font-bold uppercase tracking-widest text-gray-500 mb-1">Membro desde</p>
                  <p className="font-bold text-sm">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Courses in Progress */}
              <div>
                <h3 className="font-display font-bold text-lg uppercase tracking-wide mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-brand" />
                  Cursos em Andamento
                </h3>
                {modalLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="animate-spin text-brand" size={20} />
                  </div>
                ) : userProgress.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-3 border-2 border-dashed border-gray-300 text-center">
                    Nenhum curso em andamento.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userProgress.map((item) => (
                      <div key={item.courseName} className="border-2 border-black rounded-xl p-4 bg-white shadow-brutal-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-bold text-sm uppercase">{item.courseName}</span>
                          <span className="font-display font-bold text-sm text-brand">{item.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 border border-black overflow-hidden">
                          <div className="h-full bg-brand transition-all" style={{ width: `${item.progress}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {item.completedLessons}/{item.totalLessons} lições concluídas
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificates */}
              <div>
                <h3 className="font-display font-bold text-lg uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Award size={20} className="text-brand" />
                  Certificados Emitidos
                </h3>
                {modalLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="animate-spin text-brand" size={20} />
                  </div>
                ) : userCertificates.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-3 border-2 border-dashed border-gray-300 text-center">
                    Nenhum certificado emitido.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userCertificates.map((cert, idx) => (
                      <div key={idx} className="flex items-center justify-between border-2 border-black rounded-xl px-4 py-3 bg-emerald-50 shadow-brutal-sm">
                        <div>
                          <p className="font-display font-bold text-sm uppercase">{cert.courseName}</p>
                          <p className="text-xs text-gray-500">Emitido em {formatDate(cert.issuedAt)}</p>
                        </div>
                        <Award size={18} className="text-brand" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t-2 border-black p-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
}
