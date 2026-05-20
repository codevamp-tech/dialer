import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

// Global toast state
let toastListeners = [];
let toastId = 0;

export function toast(message, type = 'info', duration = 4000) {
  const id = ++toastId;
  const t = { id, message, type, duration };
  toastListeners.forEach(fn => fn(t));
  return id;
}

toast.success = (msg, dur) => toast(msg, 'success', dur);
toast.error = (msg, dur) => toast(msg, 'error', dur || 6000);
toast.warning = (msg, dur) => toast(msg, 'warning', dur);
toast.info = (msg, dur) => toast(msg, 'info', dur);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  info: 'border-primary/30 bg-primary/10 text-primary',
};

function ToastItem({ toast: t, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t, onRemove]);

  const Icon = icons[t.type] || Info;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-in-right ${styles[t.type]}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium flex-1">{t.message}</p>
      <button onClick={() => onRemove(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => setToasts(prev => [...prev.slice(-4), t]);
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== handler);
    };
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={remove} />
      ))}
    </div>
  );
}
