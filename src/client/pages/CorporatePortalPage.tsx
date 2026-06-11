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
        <LiveSessionPortal />
      </main>
    </div>
  );
}
