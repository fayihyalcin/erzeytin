import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastRecord extends ToastInput {
  id: number;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: number) => void;
}

const DEFAULT_DURATION = 2800;
const MAX_TOASTS = 4;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs ?? DEFAULT_DURATION);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [onDismiss, toast.durationMs, toast.id]);

  return (
    <article className={`toast-card toast-${toast.tone ?? 'success'}`} role="status">
      <div className="toast-card__accent" aria-hidden="true" />
      <div className="toast-card__body">
        <strong>{toast.title}</strong>
        {toast.description ? <p>{toast.description}</p> : null}
      </div>
      <button
        className="toast-card__close"
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Bildirimi kapat"
      >
        &times;
      </button>
    </article>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const sequenceRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    sequenceRef.current += 1;

    setToasts((current) => {
      const nextToast: ToastRecord = {
        ...toast,
        id: sequenceRef.current,
        tone: toast.tone ?? 'success',
      };

      return [...current, nextToast].slice(-MAX_TOASTS);
    });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
}
