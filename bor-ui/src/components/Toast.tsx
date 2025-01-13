import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export type ToastType = 'success' | 'error' | 'loading';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  const { userProfile } = useUser();

  useEffect(() => {
    if (toast.type !== 'loading') {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-white" />,
    error: <XCircle className="w-5 h-5 text-white" />,
    loading: <Loader2 className="w-5 h-5 text-white animate-spin" />
  };

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    loading: 'bg-blue-600'
  };

  return (
    <div 
      className={`flex items-center gap-3 p-4 rounded-lg shadow-lg ${bgColors[toast.type]} animate-fade-in min-w-[300px]`}
    >
      {icons[toast.type]}
      <p className="text-sm text-white flex-1">
        <span className="font-medium">{userProfile?.handle || 'Guest'}: </span>
        {toast.message}
      </p>
      {toast.type !== 'loading' && (
        <button
          onClick={() => onRemove(toast.id)}
          className="p-1 hover:bg-white/10 rounded-full text-white"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    
    if (type === 'loading') {
      setToasts(prev => prev.filter(t => t.type !== 'loading').concat({ id, message, type }));
    } else {
      setToasts(prev => prev.filter(t => t.type !== 'loading').concat({ id, message, type }));
    }
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const updateToast = (id: string, message: string, type: ToastType) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, message, type } : toast
      )
    );
  };

  useEffect(() => {
    (window as any).showToast = addToast;
    (window as any).updateToast = updateToast;
    (window as any).removeToast = removeToast;
    
    return () => {
      delete (window as any).showToast;
      delete (window as any).updateToast;
      delete (window as any).removeToast;
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}