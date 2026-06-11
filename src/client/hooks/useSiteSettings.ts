import { useState, useEffect } from 'react';

interface SiteSettings {
  siteName: string;
  siteLogo: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'CASEG2 - Plataforma de Cursos SST',
  siteLogo: '/logo-caseg.png',
};

let cachedSettings: SiteSettings | null = null;

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(
    cachedSettings ?? DEFAULT_SETTINGS
  );

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      return;
    }

    fetch('/api/settings/public')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const result = {
            siteName: data.siteName ?? DEFAULT_SETTINGS.siteName,
            siteLogo: data.siteLogo ?? DEFAULT_SETTINGS.siteLogo,
          };
          cachedSettings = result;
          setSettings(result);
        }
      })
      .catch(() => {});
  }, []);

  return settings;
}
