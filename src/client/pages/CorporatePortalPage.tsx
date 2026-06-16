import { Shield, Award, Users, Video } from 'lucide-react';
import { PublicHeader } from '../components/PublicLayout';
import { LiveSessionPortal } from './LiveSessionPortal';

/**
 * Página dedicada do Portal Corporativo (antiga Aula Ao Vivo)
 * Rota: /portal-corporativo
 */
export function CorporatePortalPage() {
  return (
    <div className="min-h-screen bg-white font-body text-black">
      <PublicHeader />
      <main>
        {/* Hero contextual */}
        <section className="py-16 md:py-24 border-b-2 border-black bg-emerald-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-brand text-white border-2 border-black rounded-xl shadow-brutal-sm">
              <Video size={16} strokeWidth={2.5} />
              <span className="font-display font-bold text-xs uppercase tracking-widest">
                Portal Corporativo
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-[1.05] mb-4">
              Treinamento <span className="text-brand">Ao Vivo</span> para sua Equipe
            </h1>
            <p className="font-body text-lg text-gray-700 max-w-2xl mx-auto mb-10">
              Capacite seus colaboradores com aulas ao vivo ministradas por especialistas em segurança do trabalho. 
              Acesse usando o código fornecido pela sua empresa.
            </p>

            {/* Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              <div className="flex items-center gap-3 bg-white border-2 border-black rounded-xl p-4 shadow-brutal-sm text-left">
                <div className="w-10 h-10 bg-brand text-white rounded-lg flex items-center justify-center shrink-0 border border-black">
                  <Shield size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-display font-bold text-xs uppercase tracking-wide">Certificado</p>
                  <p className="font-body text-xs text-gray-500">Válido em todo Brasil</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border-2 border-black rounded-xl p-4 shadow-brutal-sm text-left">
                <div className="w-10 h-10 bg-brand text-white rounded-lg flex items-center justify-center shrink-0 border border-black">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-display font-bold text-xs uppercase tracking-wide">Ao Vivo</p>
                  <p className="font-body text-xs text-gray-500">Interação em tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border-2 border-black rounded-xl p-4 shadow-brutal-sm text-left">
                <div className="w-10 h-10 bg-brand text-white rounded-lg flex items-center justify-center shrink-0 border border-black">
                  <Award size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-display font-bold text-xs uppercase tracking-wide">NRs</p>
                  <p className="font-body text-xs text-gray-500">Conteúdo atualizado</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Portal de Acesso */}
        <LiveSessionPortal />
      </main>
    </div>
  );
}
