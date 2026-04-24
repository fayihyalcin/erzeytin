import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LandingPageRenderer } from '../components/landing/LandingPageRenderer';
import { api, extractApiError } from '../lib/api';
import type { LandingPage } from '../types/api';

export function LandingPagePreviewPage() {
  const { landingPageId } = useParams<{ landingPageId: string }>();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!landingPageId) {
      setLoading(false);
      setError('Onizleme sayfasi bulunamadi.');
      return;
    }

    let mounted = true;

    api
      .get<LandingPage>(`/landing-pages/${landingPageId}`)
      .then((response) => {
        if (!mounted) {
          return;
        }

        setPage(response.data);
        setError('');
        document.title = `Onizleme - ${response.data.name}`;
      })
      .catch((requestError) => {
        if (!mounted) {
          return;
        }

        setError(extractApiError(requestError, 'Landing page onizlemesi yuklenemedi.'));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [landingPageId]);

  if (loading) {
    return <div className="screen-message">Onizleme yukleniyor...</div>;
  }

  if (!page) {
    return <div className="screen-message">{error || 'Landing page bulunamadi.'}</div>;
  }

  return (
    <LandingPageRenderer
      page={page}
      previewMessage="Onizleme modundasiniz. Bu ekranda siparis olusturulmaz."
      previewMode
    />
  );
}
