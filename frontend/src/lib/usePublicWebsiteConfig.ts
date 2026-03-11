import { useEffect, useState } from 'react';
import { api } from './api';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from './website-config';
import type { PublicSettingsDto, WebsiteConfig } from '../types/api';

export function usePublicWebsiteConfig() {
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [currency, setCurrency] = useState('TRY');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get<PublicSettingsDto>('/settings/public')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setConfig(parseWebsiteConfig(response.data.websiteConfig));
        setCurrency(response.data.currency ?? 'TRY');
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setConfig(createDefaultWebsiteConfig());
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { config, currency, loading };
}
