import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { PublicHeader } from './PublicLayout';
import { COMPANY, COMPANY_LOCAL, LEGAL_UPDATED_AT } from '../lib/company';

interface Props {
  title: string;
  intro?: string;
  children: ReactNode;
}

/** Estrutura comum das páginas legais (Privacidade, Termos). */
export function LegalLayout({ title, intro, children }: Props) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Cabeçalho da página */}
        <section className="bg-gray-900 text-white border-b-4 border-brand">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="inline-flex items-center gap-2 rounded-lg border-2 border-brand bg-brand/10 px-3 py-1 text-xs font-display font-bold uppercase tracking-widest text-emerald-300 mb-4">
              <ShieldCheck size={14} strokeWidth={2.5} /> Documento Legal
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-5xl mb-3">{title}</h1>
            {intro && <p className="font-body text-gray-300 max-w-2xl leading-relaxed">{intro}</p>}
            <p className="mt-4 text-xs font-mono uppercase tracking-wide text-gray-500">
              Última atualização: {LEGAL_UPDATED_AT}
            </p>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto bg-white border-2 border-black rounded-2xl shadow-brutal p-6 sm:p-10 legal-prose">
            {children}
          </div>
        </section>
      </main>

      {/* Rodapé compacto */}
      <footer className="bg-gray-900 text-white border-t-4 border-brand">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center font-body text-sm text-gray-400 space-y-2">
          <p className="font-display font-bold text-white">{COMPANY.nomeFantasia}</p>
          <p>CNPJ {COMPANY.cnpj} · {COMPANY_LOCAL}</p>
          <div className="flex items-center justify-center gap-4 pt-2 text-xs uppercase tracking-wide">
            <Link to="/privacidade" className="hover:text-brand transition-colors">Privacidade</Link>
            <span className="text-gray-700">|</span>
            <Link to="/termos" className="hover:text-brand transition-colors">Termos de Uso</Link>
            <span className="text-gray-700">|</span>
            <Link to="/contato" className="hover:text-brand transition-colors">Contato</Link>
          </div>
          <p className="text-xs text-gray-600 pt-2">© 2025 {COMPANY.marca}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

/** Título de seção padronizado. */
export function LegalSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display font-bold text-xl text-black mb-3 flex items-baseline gap-2">
        <span className="text-brand">{n}.</span> {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}
