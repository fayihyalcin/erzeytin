interface AiSeoAssistantProps {
  slugSuggestion?: string;
  titleSuggestion: string;
  descriptionSuggestion: string;
  keywordsSuggestion: string[];
  summarySuggestion?: string;
  summaryLabel?: string;
  onApplySlug?: () => void;
  onApplyTitle: () => void;
  onApplyDescription: () => void;
  onApplyKeywords: () => void;
  onApplySummary?: () => void;
}

function SuggestionMeta({ value }: { value: string }) {
  return <small>{value.length} karakter</small>;
}

export function AiSeoAssistant({
  slugSuggestion,
  titleSuggestion,
  descriptionSuggestion,
  keywordsSuggestion,
  summarySuggestion,
  summaryLabel = 'Kisa ozet onerisi',
  onApplySlug,
  onApplyTitle,
  onApplyDescription,
  onApplyKeywords,
  onApplySummary,
}: AiSeoAssistantProps) {
  const keywordText = keywordsSuggestion.join(', ');

  return (
    <section className="admin-ai-seo-box">
      <div className="admin-panel-header">
        <div>
          <h3>AI SEO onerileri</h3>
          <p>Mevcut icerikten slug, baslik, aciklama, anahtar kelime ve ozet onerileri uretir.</p>
        </div>
      </div>

      <div className="admin-ai-seo-grid">
        {slugSuggestion && onApplySlug ? (
          <article className="admin-ai-seo-card">
            <span className="admin-ai-seo-label">Slug onerisi</span>
            <strong>{slugSuggestion}</strong>
            <SuggestionMeta value={slugSuggestion} />
            <button className="admin-secondary-button" onClick={onApplySlug} type="button">
              Slug uygula
            </button>
          </article>
        ) : null}

        <article className="admin-ai-seo-card">
          <span className="admin-ai-seo-label">Meta baslik onerisi</span>
          <strong>{titleSuggestion || 'Baslik olusturmak icin temel icerik bekleniyor.'}</strong>
          <SuggestionMeta value={titleSuggestion} />
          <button className="admin-secondary-button" onClick={onApplyTitle} type="button">
            Basligi uygula
          </button>
        </article>

        <article className="admin-ai-seo-card">
          <span className="admin-ai-seo-label">Meta aciklama onerisi</span>
          <p>{descriptionSuggestion || 'Aciklama olusturmak icin daha fazla icerik ekleyin.'}</p>
          <SuggestionMeta value={descriptionSuggestion} />
          <button className="admin-secondary-button" onClick={onApplyDescription} type="button">
            Aciklamayi uygula
          </button>
        </article>

        <article className="admin-ai-seo-card">
          <span className="admin-ai-seo-label">Anahtar kelime onerisi</span>
          <p>{keywordText || 'Anahtar kelime cikarmak icin baslik veya etiket ekleyin.'}</p>
          <SuggestionMeta value={keywordText} />
          <button className="admin-secondary-button" onClick={onApplyKeywords} type="button">
            Anahtar kelimeleri uygula
          </button>
        </article>

        {summarySuggestion && onApplySummary ? (
          <article className="admin-ai-seo-card admin-ai-seo-card-wide">
            <span className="admin-ai-seo-label">{summaryLabel}</span>
            <p>{summarySuggestion}</p>
            <SuggestionMeta value={summarySuggestion} />
            <button className="admin-secondary-button" onClick={onApplySummary} type="button">
              Ozeti uygula
            </button>
          </article>
        ) : null}
      </div>
    </section>
  );
}
