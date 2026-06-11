import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Award, Download, FileText, Loader2 } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

interface Certificate {
  id: number;
  courseId: number;
  issuedAt: string | number;
  pdfPath: string;
  courseTitle: string;
  courseCategory: string;
  durationHours: number;
}

export function CertificatesPage() {
  const { accessToken } = useAuthContext();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCertificates() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/certificates/my', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Falha ao carregar certificados');
        const data = await res.json();
        setCertificates(data.certificates || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, [accessToken]);

  const formatDate = (dateValue: string | number) => {
    const date = typeof dateValue === 'number' ? new Date(dateValue * 1000) : new Date(dateValue);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <section className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-brand text-white shadow-brutal-sm">
            <Award size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-tight">
              Meus Certificados
            </h1>
            <p className="font-body text-sm text-gray-600">
              Certificados emitidos após conclusão de cursos.
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-xl border-2 border-black bg-white p-16 text-center shadow-brutal">
          <Loader2 size={40} className="mx-auto text-brand animate-spin mb-4" strokeWidth={2.5} />
          <p className="font-body text-sm text-gray-600">Carregando certificados...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border-2 border-black bg-white p-12 text-center shadow-brutal">
          <FileText size={40} className="mx-auto text-red-500 mb-4" strokeWidth={2.5} />
          <h3 className="font-display font-bold text-lg uppercase text-black">Erro ao carregar</h3>
          <p className="font-body text-sm text-gray-600 mt-2">{error}</p>
          <Button variant="outline" size="sm" className="mt-6" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-xl border-2 border-black bg-white p-16 text-center shadow-brutal">
          <Award size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={2.5} />
          <h3 className="font-display font-bold text-xl uppercase text-black mb-2">
            Nenhum certificado ainda
          </h3>
          <p className="font-body text-sm text-gray-600 max-w-md mx-auto">
            Complete 100% das lições de um curso para receber seu certificado digital automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-brand text-white shadow-brutal-sm">
                  <Award size={20} strokeWidth={2.5} />
                </div>
                <span className="rounded-lg border-2 border-black bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-black shadow-brutal-sm">
                  {cert.courseCategory}
                </span>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg uppercase leading-tight mb-1">
                  {cert.courseTitle}
                </h3>
                <p className="font-body text-xs text-gray-500 uppercase tracking-wide">
                  {cert.durationHours}h · Emitido em {formatDate(cert.issuedAt)}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-200">
                <Button variant="dark" size="sm" className="w-full gap-2">
                  <Download size={16} strokeWidth={2.5} />
                  Baixar PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
