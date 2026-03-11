import type { ReactNode } from 'react';

export interface AdminWizardStep {
  id: string;
  title: string;
  description: string;
}

export function AdminFormWizard({
  steps,
  currentStep,
  onStepChange,
  title,
  description,
  summary,
  children,
}: {
  steps: AdminWizardStep[];
  currentStep: string;
  onStepChange: (stepId: string) => void;
  title: string;
  description: string;
  summary?: ReactNode;
  children: ReactNode;
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep),
  );
  const progress = ((currentIndex + 1) / Math.max(steps.length, 1)) * 100;

  return (
    <div className="admin-wizard-shell">
      <aside className="admin-wizard-sidebar">
        <div className="admin-wizard-intro">
          <span className="admin-eyebrow">Akis Tasarimi</span>
          <h3>{title}</h3>
          <p>{description}</p>

          <div className="admin-wizard-progress">
            <div className="admin-wizard-progress-meta">
              <strong>
                {currentIndex + 1}/{steps.length}
              </strong>
              <span>adim tamamlandi</span>
            </div>
            <div className="admin-wizard-progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="admin-wizard-steps">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentIndex;
            const className = isActive
              ? 'admin-wizard-step active'
              : isCompleted
                ? 'admin-wizard-step completed'
                : 'admin-wizard-step';

            return (
              <button
                key={step.id}
                aria-current={isActive ? 'step' : undefined}
                className={className}
                onClick={() => onStepChange(step.id)}
                type="button"
              >
                <span className="admin-wizard-step-index">
                  {isCompleted ? 'OK' : `${index + 1}`.padStart(2, '0')}
                </span>
                <span className="admin-wizard-step-copy">
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        {summary ? <div className="admin-wizard-summary">{summary}</div> : null}
      </aside>

      <div className="admin-wizard-main">{children}</div>
    </div>
  );
}
