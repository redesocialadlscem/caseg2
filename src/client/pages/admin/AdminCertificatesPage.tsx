import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Search,
  ChevronRight,
  ArrowRight,
  Eye,
  X,
  Printer,
  ShieldAlert,
  Calendar,
  Hash,
  TrendingUp,
  CheckCircle2,
  Filter,
  User,
  Download,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuthContext } from '../../context/AuthContext';

// --- TYPES ---
interface AdminCertificate {
  id: string;
  studentName: string;
  courseName: string;
  issuedAt: string;
  code: string;
  durationHours: number;
}

// --- MOCK DATA ---


// --- COMPONENTS ---

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-black text-white border-2 border-black shadow-brutal px-6 py-4 flex items-center gap-3 max-w-sm">
        <CheckCircle2 className="text-brand-light shrink-0" size={20} />
        <p className="font-display font-bold text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function CertificateModal({
  cert,
  onClose,
}: {
  cert: AdminCertificate;
  onClose: () => void;
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative bg-white border-2 border-black shadow-brutal rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b-2 border-black p-4 sm:p-6 flex items-start justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-brand text-white shadow-brutal-sm">
              <Award size={20} strokeWidth={2.5} />
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl uppercase">
              Visualizar Certificado
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 border-2 border-black bg-white hover:bg-gray-100 brutal-interactive"
          >
            <X size={20} />
          </button>
        </div>

        {/* Certificate Preview - Neo-Brutalist Style */}
        <div className="p-6 sm:p-8 bg-gray-100">
          <div className="bg-white border-4 border-black p-8 sm:p-12 relative shadow-brutal">
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-brand" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-brand" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-brand" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-brand" />

            {/* Certificate Content */}
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-4">
                <div className="bg-brand text-white p-4 rounded-full border-2 border-black shadow-brutal-sm">
                  <Award size={40} strokeWidth={2} />
                </div>
              </div>

              <div>
                <p className="font-body text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">
                  Certificado de Conclusão
                </p>
                <h3 className="font-display font-bold text-3xl sm:text-4xl uppercase text-black leading-tight">
                  CASEG2 Academy
                </h3>
              </div>

              <div className="py-4 border-y-2 border-dashed border-gray-300 my-6">
                <p className="font-body text-sm text-gray-600 mb-2">
                  Certificamos que
                </p>
                <p className="font-display font-bold text-2xl sm:text-3xl text-brand uppercase">
                  {cert.studentName}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-body text-sm text-gray-600">
                  concluiu com êxito o curso de
                </p>
                <p className="font-display font-bold text-xl sm:text-2xl uppercase text-black">
                  {cert.courseName}
                </p>
                <p className="font-body text-sm text-gray-600">
                  com carga horária de <strong className="text-black">{cert.durationHours} horas</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t-2 border-black">
                <div className="text-left">
                  <p className="font-body text-[clamp(8px,1vw,10px)] uppercase tracking-widest text-gray-500 mb-1">
                    Data de Emissão
                  </p>
                  <p className="font-display font-bold text-sm">
                    {formatDate(cert.issuedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body text-[clamp(8px,1vw,10px)] uppercase tracking-widest text-gray-500 mb-1">
                    Código de Verificação
                  </p>
                  <p className="font-mono font-bold text-sm bg-gray-100 inline-block px-2 py-1 border border-black">
                    {cert.code}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-black p-4 flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="gap-2">
            Fechar
          </Button>
          <Button
            variant="dark"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer size={16} strokeWidth={2.5} />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCert, setSelectedCert] = useState<AdminCertificate | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');
  const [debouncedStudent, setDebouncedStudent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 20;

  const { accessToken } = useAuthContext();

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedStudent) params.set('student', debouncedStudent);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    fetch(`/api/admin/certificates?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : { certificates: [], total: 0 }))
      .then((data) => {
        if (data && Array.isArray(data.certificates)) {
          setCertificates(data.certificates);
          setTotal(data.total ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, page, debouncedSearch, debouncedStudent, dateFrom, dateTo]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Debounce student filter
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedStudent(studentFilter);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [studentFilter]);

  // Reset page when date filters change
  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo]);

  const totalPages = Math.ceil(total / limit);

  // Stats derived from data
  const stats = useMemo(() => {
    const totalCerts = total;
    const thisMonth = certificates.filter((c) => {
      const d = new Date(c.issuedAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    
    // Count unique courses
    const courseCount = new Map<string, number>();
    certificates.forEach((c) => {
      courseCount.set(c.courseName, (courseCount.get(c.courseName) || 0) + 1);
    });
    let topCourse = '-';
    let maxCount = 0;
    courseCount.forEach((count, name) => {
      if (count > maxCount) {
        maxCount = count;
        topCourse = name.split(' ')[0]; // Just "NR-XX"
      }
    });

    return [
      { label: 'Total de Certificados', value: totalCerts.toString(), icon: Award },
      { label: 'Emitidos Este Mês', value: thisMonth.toString(), icon: Calendar },
      { label: 'Curso Mais Popular', value: topCourse, icon: TrendingUp },
      { label: 'Taxa de Conclusão', value: '78%', icon: CheckCircle2 },
    ];
  }, [certificates, total]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (debouncedStudent) params.set('student', debouncedStudent);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/admin/certificates/export?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificados_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(`Arquivo exportado com sucesso`);
    } catch {
      showToast('Erro ao exportar certificados');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/certificates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setCertificates((prev) => prev.filter((c) => c.id !== id));
        setTotal((prev) => prev - 1);
        showToast('Certificado revogado com sucesso');
      } else {
        showToast('Erro ao revogar certificado');
      }
    } catch {
      showToast('Erro ao revogar certificado');
    } finally {
      setConfirmRevokeId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
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
              <span className="text-black">Certificados</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl flex items-center gap-3">
              <Award className="text-brand" size={36} />
              Certificados Emitidos
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
                <p className="font-display font-bold text-4xl text-black truncate">
                  {stat.value}
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
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-display font-bold text-xl uppercase tracking-wide">
                Todos os Certificados
              </h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Buscar por aluno, curso ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!py-2.5 !text-sm"
                  />
                </div>
                <Button
                  variant="dark"
                  size="sm"
                  onClick={handleExport}
                  disabled={loading || total === 0}
                  className="gap-2 shrink-0"
                >
                  <Download size={16} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 shrink-0">
                <Filter size={14} />
                Filtros
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                {/* Student filter */}
                <div className="relative w-full sm:w-56">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por aluno..."
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border-2 border-black rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* Date From */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-500 whitespace-nowrap">De:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 text-sm border-2 border-black rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* Date To */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-500 whitespace-nowrap">Até:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 text-sm border-2 border-black rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* Clear filters */}
                {(studentFilter || dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setStudentFilter('');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-800 underline underline-offset-2 whitespace-nowrap"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-2 border-black rounded-xl shadow-brutal overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand text-white border-b-2 border-black">
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm">Aluno</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden md:table-cell">Curso</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden lg:table-cell">Data Emissão</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm hidden xl:table-cell">Código</th>
                    <th className="p-4 font-display font-bold uppercase tracking-wider text-sm text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                          <p className="font-display font-bold text-lg">Carregando...</p>
                        </div>
                      </td>
                    </tr>
                  ) : certificates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <Search size={40} strokeWidth={1.5} />
                          <p className="font-display font-bold text-lg">Nenhum certificado encontrado</p>
                          <p className="text-sm">Tente ajustar sua busca.</p>
                        </div>
                      </td>
                    </tr>                    ) : (
                      certificates.map((cert) => (
                      <tr
                        key={cert.id}
                        className="border-b-2 border-black last:border-none hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4 font-bold text-sm">{cert.studentName}</td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wide border-2 border-black bg-emerald-50 text-black">
                            {cert.courseName}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500 hidden lg:table-cell whitespace-nowrap">
                          {formatDate(cert.issuedAt)}
                        </td>
                        <td className="p-4 hidden xl:table-cell">
                          <code className="font-mono text-xs bg-gray-100 px-2 py-1 border border-black">
                            {cert.code}
                          </code>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedCert(cert)}
                              title="Visualizar Certificado"
                              className="p-2 border-2 border-black bg-white hover:bg-emerald-50 brutal-interactive"
                            >
                              <Eye size={16} />
                            </button>
                            {confirmRevokeId === cert.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleRevoke(cert.id)}
                                  className="px-3 py-1.5 text-xs font-bold uppercase border-2 border-black bg-red-600 text-white brutal-interactive"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setConfirmRevokeId(null)}
                                  className="p-1.5 border-2 border-black bg-white hover:bg-gray-100 brutal-interactive"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRevokeId(cert.id)}
                                title="Revogar Certificado"
                                className="p-2 border-2 border-black bg-white hover:bg-red-50 text-red-600 brutal-interactive"
                              >
                                <ShieldAlert size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500 font-bold">
                Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 text-sm font-bold">
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
            </div>
          )}
        </section>
      </main>

      {/* Certificate View Modal */}
      {selectedCert && (
        <CertificateModal
          cert={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
}
