import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface DeliveryFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  minOrder: string | number;
}

export default function DeliveryFeeModal({ isOpen, onClose, minOrder }: DeliveryFeeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white shadow-2xl rounded-xl z-10 p-6 pt-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button */}
            <button 
              onClick={onClose}
              className="absolute -top-3 -right-3 w-10 h-10 bg-[#e6203a] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-700 transition-colors z-20"
            >
              <X size={20} strokeWidth={2} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-[19px] font-black text-on-surface mb-1">Delivery Fee</h3>
              <p className="text-[13px] text-on-surface-variant">Min £{Number(minOrder).toFixed(2)}</p>
            </div>

            {/* Table */}
            <div className="mb-6">
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/30 px-2">
                <span className="text-[13px] font-bold text-on-surface">Order value*</span>
                <span className="text-[13px] font-bold text-on-surface">Delivery</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/30 px-2">
                <span className="text-[14px] text-on-surface-variant">&lt; £40.00</span>
                <span className="text-[14px] text-on-surface-variant text-right">£1.99 - £5.99<br/><span className="text-[10px]">(Based on distance)</span></span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-outline-variant/30 px-2">
                <span className="text-[14px] text-on-surface-variant">£40.00</span>
                <span className="text-[14px] text-on-surface-variant">Free</span>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-on-surface-variant/80 text-center mb-6">
              * Excluding offers, service charges and delivery fees.
            </p>

            {/* Action Button */}
            <button 
              onClick={onClose}
              className="w-full bg-[#18539b] hover:bg-[#12427a] text-white font-bold py-3.5 rounded-lg transition-colors text-[15px]"
            >
              Close
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
