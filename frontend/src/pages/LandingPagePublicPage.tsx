import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LandingPageRenderer } from '../components/landing/LandingPageRenderer';
import { api, extractApiError } from '../lib/api';
import type { LandingPage } from '../types/api';

export function LandingPagePublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Landing page bulunamadi.');
      return;
    }

    let mounted = true;

    api
      .get<LandingPage>(`/landing-pages/public/${encodeURIComponent(slug)}`, {
        requiresAdminAuth: false,
      })
      .then((response) => {
        if (!mounted) {
          return;
        }

        setPage(response.data);
        setError('');
        document.title = response.data.seoTitle || `${response.data.name} - Hizli Siparis`;
      })
      .catch((requestError) => {
        if (!mounted) {
          return;
        }

        setError(extractApiError(requestError, 'Landing page yuklenemedi.'));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return <div className="screen-message">Landing page yukleniyor...</div>;
  }

  if (!page) {
    return <div className="screen-message">{error || 'Landing page bulunamadi.'}</div>;
  }

  return <LandingPageRenderer page={page} />;
}
