import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Upload,
  Shield,
  Bell,
  Wrench,
  Info,
  Check,
  AlertTriangle,
  Database,
  Clock,
  HardDrive,
  Trash2,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuthContext } from '../../context/AuthContext';

// --- TYPES ---
interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  logoPreview: string | null;
}

interface SecuritySettings {
  tokenExpiration: string;
  allowPublicRegistration: boolean;
  requireEmailVerification: boolean;
  maxLoginAttempts: number;
}

interface NotificationSettings {
  welcomeEmail: boolean;
  notifyAdminNewUser: boolean;
  emailTemplate: string;
}

interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

// --- COMPONENTS ---

/** Toggle Switch Brutalista */
function BrutalToggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <span className="font-display font-bold text-black block">{label}</span>
        {description && (
          <span className="text-sm text-gray-600 mt-0.5 block">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-8 w-14 shrink-0 cursor-pointer border-2 border-black transition-all duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
          ${checked ? 'bg-brand' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-7 w-7 transform border-2 border-black bg-white shadow-brutal-sm transition-all duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

/** Card Wrapper Brutalista */
function SettingsCard({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white border-2 border-black rounded-xl shadow-brutal overflow-hidden ${className}`}
    >
      <div className="border-b-2 border-black bg-gray-50 px-6 py-4 flex items-center gap-3">
        <div className="bg-brand text-white p-2 border-2 border-black">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <h2 className="font-display font-bold text-lg uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

/** Toast Notification */
function Toast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideIn_0.3s_ease-out]">
      <div className="bg-brand text-white border-2 border-black px-6 py-4 rounded-xl shadow-brutal flex items-center gap-3">
        <Check size={20} strokeWidth={3} />
        <span className="font-display font-bold">{message}</span>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export function AdminSettingsPage() {
  const { accessToken } = useAuthContext();

  // State - General
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'CASEG - Segurança do Trabalho',
    tagline: 'Plataforma líder em cursos de segurança e conformidade NR.',
    contactEmail: 'contato@caseg.com.br',
    logoPreview: '/logo-caseg.png',
  });

  // State - Security
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    tokenExpiration: '1h',
    allowPublicRegistration: true,
    requireEmailVerification: false,
    maxLoginAttempts: 5,
  });

  // State - Notifications
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    welcomeEmail: true,
    notifyAdminNewUser: true,
    emailTemplate: 'Olá {{name}},\n\nBem-vindo à CASEG! Sua conta foi criada com sucesso.\n\nAtenciosamente,\nEquipe CASEG',
  });

  // State - Maintenance
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({
    maintenanceMode: false,
    maintenanceMessage: 'Estamos realizando manutenção programada. Voltaremos em breve!',
  });

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Carregar settings da API ao montar
  useEffect(() => {
    if (!accessToken) return;

    fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSiteSettings((prev) => ({
            ...prev,
            siteName: data.siteName ?? prev.siteName,
            tagline: data.tagline ?? prev.tagline,
            contactEmail: data.contactEmail ?? prev.contactEmail,
            logoPreview: data.siteLogo ?? prev.logoPreview,
          }));
          setSecuritySettings((prev) => ({
            ...prev,
            tokenExpiration: data.tokenExpiration ?? prev.tokenExpiration,
            allowPublicRegistration: data.allowRegistration ?? prev.allowPublicRegistration,
            requireEmailVerification: data.requireEmailVerification ?? prev.requireEmailVerification,
            maxLoginAttempts: data.maxLoginAttempts ?? prev.maxLoginAttempts,
          }));
          setNotificationSettings((prev) => ({
            ...prev,
            welcomeEmail: data.welcomeEmail ?? prev.welcomeEmail,
            notifyAdminNewUser: data.notifyAdminNewUser ?? prev.notifyAdminNewUser,
            emailTemplate: data.emailTemplate ?? prev.emailTemplate,
          }));
          setMaintenanceSettings((prev) => ({
            ...prev,
            maintenanceMode: data.maintenanceMode ?? prev.maintenanceMode,
            maintenanceMessage: data.maintenanceMessage ?? prev.maintenanceMessage,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!accessToken) return;
      const payload = {
        // General
        siteName: siteSettings.siteName,
        siteLogo: siteSettings.logoPreview ?? '/logo-caseg.png',
        tagline: siteSettings.tagline,
        contactEmail: siteSettings.contactEmail,
        // Security
        tokenExpiration: securitySettings.tokenExpiration,
        allowRegistration: securitySettings.allowPublicRegistration,
        requireEmailVerification: securitySettings.requireEmailVerification,
        maxLoginAttempts: securitySettings.maxLoginAttempts,
        // Notifications
        welcomeEmail: notificationSettings.welcomeEmail,
        notifyAdminNewUser: notificationSettings.notifyAdminNewUser,
        emailTemplate: notificationSettings.emailTemplate,
        // Maintenance
        maintenanceMode: maintenanceSettings.maintenanceMode,
        maintenanceMessage: maintenanceSettings.maintenanceMessage,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowToast(true);
      }
    } catch {
      // silently fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSiteSettings((prev) => ({ ...prev, logoPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {/* Header */}
        <header className="mb-10">
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-black mb-2">
            Configurações
          </h1>
          <p className="text-gray-600 text-lg">Gerencie as preferências globais da plataforma.</p>
        </header>

        <div className="max-w-4xl space-y-8">
          {/* 1. General Settings */}
          <SettingsCard title="Configurações Gerais" icon={Settings}>
            <div className="space-y-6">
              <div>
                <label className="block font-display font-bold text-sm uppercase mb-2">
                  Nome do Site
                </label>
                <Input
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                  placeholder="Nome da plataforma"
                />
              </div>

              <div>
                <label className="block font-display font-bold text-sm uppercase mb-2">
                  Descrição / Tagline
                </label>
                <textarea
                  value={siteSettings.tagline}
                  onChange={(e) => setSiteSettings({ ...siteSettings, tagline: e.target.value })}
                  rows={2}
                  className="w-full border-2 border-black rounded-xl p-3 font-sans text-base focus:outline-none focus:shadow-[var(--shadow-brutal)] focus:-translate-y-0.5 transition-all resize-none bg-white"
                />
              </div>

              <div>
                <label className="block font-display font-bold text-sm uppercase mb-2">
                  Email de Contato
                </label>
                <Input
                  type="email"
                  value={siteSettings.contactEmail}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                  placeholder="contato@exemplo.com"
                />
              </div>

              <div>
                <label className="block font-display font-bold text-sm uppercase mb-2">
                  Logo do Site
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-black border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group">
                  {siteSettings.logoPreview ? (
                    <img
                      src={siteSettings.logoPreview}
                      alt="Logo preview"
                      className="h-20 object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-black">
                      <ImageIcon size={32} />
                      <span className="font-display font-bold text-sm">Clique para enviar logo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
          </SettingsCard>

          {/* 2. Security & Auth */}
          <SettingsCard title="Segurança & Autenticação" icon={Shield}>
            <div className="space-y-4">
              <div>
                <label className="block font-display font-bold text-sm uppercase mb-2">
                  Expiração do Token JWT
                </label>
                <select
                  value={securitySettings.tokenExpiration}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, tokenExpiration: e.target.value })
                  }
                  className="w-full border-2 border-black rounded-xl p-3 font-sans text-base bg-white focus:outline-none focus:shadow-[var(--shadow-brutal)] focus:-translate-y-0.5 transition-all appearance-none cursor-pointer"
                >
                  <option value="15m">15 Minutos</option>
                  <option value="30m">30 Minutos</option>
                  <option value="1h">1 Hora</option>
                  <option value="4h">4 Horas</option>
                </select>
              </div>

              <div className="border-t-2 border-gray-100 my-4" />

              <BrutalToggle
                label="Permitir Registro Público"
                description="Usuários podem criar contas sem convite."
                checked={securitySettings.allowPublicRegistration}
                onChange={(v) => setSecuritySettings({ ...securitySettings, allowPublicRegistration: v })}
              />

              <BrutalToggle
                label="Exigir Verificação de Email"
                description="Bloqueia acesso até confirmação do email."
                checked={securitySettings.requireEmailVerification}
                onChange={(v) => setSecuritySettings({ ...securitySettings, requireEmailVerification: v })}
              />

              <div className="border-t-2 border-gray-100 my-4" />

              <div>
                <label className="block font-display font-bold text-sm uppercase mb-2">
                  Máx. Tentativas de Login
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      maxLoginAttempts: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-32"
                />
                <p className="text-xs text-gray-500 mt-1">Conta bloqueada após exceder este limite.</p>
              </div>
            </div>
          </SettingsCard>

          {/* 3. Notifications */}
          <SettingsCard title="Notificações" icon={Bell}>
            <div className="space-y-4">
              <BrutalToggle
                label="Email de Boas-Vindas Automático"
                description="Enviado imediatamente após o cadastro."
                checked={notificationSettings.welcomeEmail}
                onChange={(v) => setNotificationSettings({ ...notificationSettings, welcomeEmail: v })}
              />

              <BrutalToggle
                label="Notificar Admin sobre Novo Cadastro"
                description="Receba um alerta para cada novo usuário."
                checked={notificationSettings.notifyAdminNewUser}
                onChange={(v) =>
                  setNotificationSettings({ ...notificationSettings, notifyAdminNewUser: v })
                }
              />

              <div className="border-t-2 border-gray-100 my-4" />

              <div>
                <label className="block font-display font-bold text-sm uppercase mb-2">
                  Template de Email de Boas-Vindas
                </label>
                <textarea
                  value={notificationSettings.emailTemplate}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, emailTemplate: e.target.value })
                  }
                  rows={5}
                  className="w-full border-2 border-black rounded-xl p-3 font-mono text-sm focus:outline-none focus:shadow-[var(--shadow-brutal)] focus:-translate-y-0.5 transition-all resize-y bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variáveis disponíveis: {'{{name}}'}, {'{{email}}'}, {'{{date}}'}
                </p>
              </div>
            </div>
          </SettingsCard>

          {/* 4. Maintenance */}
          <SettingsCard title="Manutenção" icon={Wrench}>
            <div className="space-y-6">
              {maintenanceSettings.maintenanceMode && (
                <div className="bg-yellow-100 border-2 border-black p-4 rounded-xl flex items-start gap-3 shadow-brutal">
                  <AlertTriangle size={24} className="shrink-0 text-black" strokeWidth={2.5} />
                  <div>
                    <p className="font-display font-bold text-black">Modo Manutenção ATIVO</p>
                    <p className="text-sm text-black/80 mt-1">
                      O site está inacessível para visitantes. Apenas admins podem entrar.
                    </p>
                  </div>
                </div>
              )}

              <BrutalToggle
                label="Ativar Modo Manutenção"
                description="Bloqueia o acesso público ao site."
                checked={maintenanceSettings.maintenanceMode}
                onChange={(v) =>
                  setMaintenanceSettings({ ...maintenanceSettings, maintenanceMode: v })
                }
              />

              <div>
                <label className="block font-display font-bold text-sm uppercase mb-2">
                  Mensagem de Manutenção
                </label>
                <textarea
                  value={maintenanceSettings.maintenanceMessage}
                  onChange={(e) =>
                    setMaintenanceSettings({
                      ...maintenanceSettings,
                      maintenanceMessage: e.target.value,
                    })
                  }
                  rows={3}
                  disabled={!maintenanceSettings.maintenanceMode}
                  className="w-full border-2 border-black rounded-xl p-3 font-sans text-base focus:outline-none focus:shadow-[var(--shadow-brutal)] focus:-translate-y-0.5 transition-all resize-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="border-t-2 border-black my-6 pt-6">
                <h3 className="font-display font-bold text-red-600 uppercase mb-4 flex items-center gap-2">
                  <Trash2 size={18} />
                  Zona de Perigo
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    onClick={() => alert('Funcionalidade de limpeza de cache ainda não implementada.')}
                    className="gap-2 border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                    Limpar Cache
                  </Button>
                  <Button
                    onClick={() => alert('Funcionalidade de backup ainda não implementada.')}
                    className="gap-2 bg-black text-white hover:bg-gray-800"
                  >
                    <Download size={18} />
                    Backup do Banco
                  </Button>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* 5. System Info */}
          <SettingsCard title="Sobre o Sistema" icon={Info}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border-2 border-black rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Info size={16} />
                  <span className="text-xs font-bold uppercase">Versão</span>
                </div>
                <p className="font-display font-bold text-2xl text-black">v2.4.1</p>
              </div>
              <div className="border-2 border-black rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase">Uptime</span>
                </div>
                <p className="font-display font-bold text-2xl text-black">14d 6h</p>
              </div>
              <div className="border-2 border-black rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Database size={16} />
                  <span className="text-xs font-bold uppercase">Banco de Dados</span>
                </div>
                <p className="font-display font-bold text-2xl text-black">24.8 MB</p>
              </div>
            </div>
          </SettingsCard>

          {/* Save Button Sticky */}
          <div className="sticky bottom-6 flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-3 px-8 py-4 text-lg bg-brand text-white hover:bg-green-800 shadow-[var(--shadow-brutal-lg)]"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin">⟳</span> Salvando...
                </>
              ) : (
                <>
                  <Save size={22} /> Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <Toast
        message="Configurações salvas com sucesso!"
        visible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
