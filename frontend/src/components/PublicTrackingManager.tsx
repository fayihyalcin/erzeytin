import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import {
  captureTrackingTouchpoint,
  firePageTrackingScripts,
  shouldTrackPublicPath,
} from '../lib/tracking';
import type { PublicSettingsDto } from '../types/api';

type TrackingPageSettings = Pick<
  PublicSettingsDto,
  'metaPixelPageScript' | 'tiktokPixelPageScript'
>;

const emptyTrackingSettings: TrackingPageSettings = {
  metaPixelPageScript: '',
  tiktokPixelPageScript: '',
};

export function PublicTrackingManager() {
  const location = useLocation();
  const [settings, setSettings] = useState<TrackingPageSettings>(emptyTrackingSettings);

  useEffect(() => {
    if (!shouldTrackPublicPath(location.pathname)) {
      return;
    }

    let mounted = true;

    api
      .get<PublicSettingsDto>('/settings/public', { requiresAdminAuth: false })
      .then((response) => {
        if (!mounted) {
          return;
        }

        setSettings({
          metaPixelPageScript: response.data.metaPixelPageScript ?? '',
          tiktokPixelPageScript: response.data.tiktokPixelPageScript ?? '',
        });
      })
      .catch(() => {
        if (mounted) {
          setSettings(emptyTrackingSettings);
        }
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!shouldTrackPublicPath(location.pathname)) {
      return;
    }

    captureTrackingTouchpoint();
    firePageTrackingScripts(settings, `${location.pathname}${location.search}`);
  }, [location.pathname, location.search, settings]);

  return null;
}
