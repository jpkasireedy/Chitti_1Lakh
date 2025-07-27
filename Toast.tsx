import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, CloseIcon } from './Icon';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: number) => void;
}

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
};

const colors: Record<ToastType, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
};


const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const Icon = icons[toast.type];
  const bgColor = colors[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onRemove]);

  return (
    <div className={`toast-in flex items-center p-4 mb-4 text-white ${bgColor} rounded-lg shadow-lg w-full max-w-sm`}>
      <div className="flex-shrink-0">
         <Icon className="w-6 h-6" />
      </div>
      <div className="ml-3 text-sm font-medium flex-grow">
        {toast.message}
      </div>
      <button 
        onClick={() => onRemove(toast.id)} 
        className="-mx-1.5 -my-1.5 ml-2 bg-white/20 hover:bg-white/30 rounded-lg p-1.5 inline-flex h-8 w-8 items-center justify-center transition-colors"
        aria-label="Close"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({toasts, removeToast}) => {
    return (
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    )
}


export default ToastContainer;
