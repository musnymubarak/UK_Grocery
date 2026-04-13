import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = '450px' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full bg-surface shadow-2xl rounded-3xl overflow-hidden z-10"
            style={{ maxWidth }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="px-8 pt-8 pb-4 flex justify-between items-center text-on-surface">
                <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 -mr-2 text-secondary hover:text-primary transition-colors hover:bg-primary/5 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="px-8 py-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-8 pb-8 flex gap-3 justify-end">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
