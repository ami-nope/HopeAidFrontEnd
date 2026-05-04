import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-950/10 animate-in fade-in zoom-in-95 duration-200 dark:border-gray-800 dark:bg-[#0a0a0a] dark:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200/80 p-5 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-200/80 bg-slate-50/80 p-5 dark:border-gray-800 dark:bg-[#0a0a0a]/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
