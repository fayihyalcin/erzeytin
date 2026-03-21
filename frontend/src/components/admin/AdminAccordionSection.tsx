import type { ReactNode } from 'react';

export function AdminAccordionSection({
  actions,
  children,
  description,
  dirty = false,
  isOpen,
  onSave,
  onToggle,
  saveDisabled = false,
  saving = false,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  dirty?: boolean;
  isOpen: boolean;
  onSave: () => void;
  onToggle: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
  title: string;
}) {
  return (
    <section className="admin-accordion-section">
      <button
        aria-expanded={isOpen}
        className={isOpen ? 'admin-accordion-toggle active' : 'admin-accordion-toggle'}
        onClick={onToggle}
        type="button"
      >
        <div className="admin-accordion-copy">
          <strong>{title}</strong>
          <small>{description}</small>
        </div>
        <div className="admin-accordion-meta">
          <span className={dirty ? 'admin-chip info' : 'admin-chip'}>
            {dirty ? 'Degisiklik var' : 'Kayitli'}
          </span>
          <span className="admin-accordion-arrow">{isOpen ? '-' : '+'}</span>
        </div>
      </button>

      {isOpen ? (
        <div className="admin-panel admin-accordion-panel">
          {actions ? <div className="admin-accordion-actions">{actions}</div> : null}
          <div className="admin-accordion-body">{children}</div>
          <div className="admin-form-actions">
            <button
              className="admin-primary-button"
              disabled={saveDisabled || saving}
              onClick={onSave}
              type="button"
            >
              {saving ? 'Kaydediliyor...' : 'Bu bolumu kaydet'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
