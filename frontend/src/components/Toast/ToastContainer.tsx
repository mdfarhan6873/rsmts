'use client';

import React, { useEffect } from 'react';
import { ToastMessage } from '../../contexts/ToastContext';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, removeToast }: { toast: ToastMessage; removeToast: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 5000); // 5 seconds auto-dismiss
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  let icon = <Info className="h-5 w-5 text-blue-500" />;
  let bgColor = 'bg-white';
  let borderColor = 'border-blue-100';
  let textColor = 'text-gray-800';

  if (toast.type === 'success') {
    icon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
    borderColor = 'border-green-100';
  } else if (toast.type === 'error') {
    icon = <XCircle className="h-5 w-5 text-red-500" />;
    borderColor = 'border-red-100';
  }

  return (
    <div className={`pointer-events-auto flex items-center gap-3 w-80 px-4 py-3 rounded-xl shadow-lg border ${bgColor} ${borderColor} transform transition-all duration-300 translate-y-0 opacity-100`}>
      {icon}
      <p className={`flex-1 text-sm font-medium ${textColor}`}>{toast.message}</p>
      <button 
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
