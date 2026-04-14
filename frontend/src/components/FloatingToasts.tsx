"use client";
import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: {
    bg: 'bg-green-950/60 border-green-500/30',
    icon: 'text-green-400',
    title: 'text-green-100',
    text: 'text-green-200',
  },
  error: {
    bg: 'bg-red-950/60 border-red-500/30',
    icon: 'text-red-400',
    title: 'text-red-100', 
    text: 'text-red-200',
  },
  info: {
    bg: 'bg-blue-950/60 border-blue-500/30',
    icon: 'text-blue-400',
    title: 'text-blue-100',
    text: 'text-blue-200',
  },
  warning: {
    bg: 'bg-amber-950/60 border-amber-500/30',
    icon: 'text-amber-400',
    title: 'text-amber-100',
    text: 'text-amber-200',
  },
};

function ToastItem({ toast, onClose }: ToastItemProps) {
  const Icon = icons[toast.type];
  const style = styles[toast.type];
  
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  return (
    <div className={clsx(
      "relative group pointer-events-auto",
      "backdrop-blur-xl border rounded-xl p-4 shadow-2xl",
      "transition-all duration-300 ease-out",
      "animate-in slide-in-from-right-2 duration-300",
      "hover:scale-[1.02] hover:shadow-3xl",
      style.bg
    )}>
      {/* Glow effect */}
      <div className={clsx(
        "absolute inset-0 rounded-xl opacity-20 blur-xl",
        toast.type === 'success' && "bg-green-500/40",
        toast.type === 'error' && "bg-red-500/40", 
        toast.type === 'info' && "bg-blue-500/40",
        toast.type === 'warning' && "bg-amber-500/40"
      )} />
      
      <div className="relative flex items-start gap-3">
        <Icon size={20} className={clsx(style.icon, "flex-shrink-0 mt-0.5")} />
        
        <div className="flex-1 min-w-0">
          <p className={clsx("font-semibold text-sm", style.title)}>
            {toast.title}
          </p>
          {toast.message && (
            <p className={clsx("text-sm mt-1 leading-relaxed", style.text)}>
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={clsx(
                "mt-3 text-xs font-medium px-3 py-1.5 rounded-lg",
                "bg-white/10 hover:bg-white/20 transition-all duration-200",
                "border border-white/20 hover:border-white/30",
                style.title
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={() => onClose(toast.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
            p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white/90"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function FloatingToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Expose addToast globally
  useEffect(() => {
    (window as any).showToast = addToast;
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <div className="flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  );
}

// Utility function to show toast from anywhere
declare global {
  interface Window {
    showToast?: (toast: Omit<Toast, 'id'>) => void;
  }
}

export const showToast = (toast: Omit<Toast, 'id'>) => {
  if (window.showToast) {
    window.showToast(toast);
  }
};
