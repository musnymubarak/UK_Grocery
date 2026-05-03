import React from 'react';
import Layout from '../components/Layout';
import { motion } from 'motion/react';
import { Scale, ShoppingBag, Truck, AlertCircle, Ban, RefreshCw } from 'lucide-react';

interface LegalSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const LegalSection = ({ title, icon, children }: LegalSectionProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="mb-12"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-primary/10 text-primary rounded-2xl">
        {icon}
      </div>
      <h2 className="text-2xl font-black tracking-tight text-on-surface">{title}</h2>
    </div>
    <div className="prose prose-sm md:prose-base prose-slate max-w-none text-on-surface-variant leading-relaxed space-y-4">
      {children}
    </div>
  </motion.div>
);

export default function TermsOfService() {
  return (
    <Layout title="Terms of Service" showBack>
      <div className="max-w-4xl mx-auto px-6 py-16 pb-32">
        <header className="mb-16 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Scale size={14} /> Service Agreement
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-on-surface mb-6">
            Terms of <span className="text-primary">Service</span>
          </h1>
          <p className="text-on-surface-variant text-lg font-medium max-w-2xl mx-auto">
            Please read these terms carefully before using the Daily Grocer platform. By using our service, you agree to these conditions.
          </p>
        </header>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-8 md:p-12 shadow-sm">
          <LegalSection title="Age-Restricted Items" icon={<Ban size={24} />}>
            <p><strong>Strict Age Verification:</strong> We operate a strict "Challenge 25" policy for the sale of age-restricted products, including but not limited to alcohol and tobacco.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be 18 years or older to purchase age-restricted items.</li>
              <li>You will be required to confirm your age at checkout.</li>
              <li>Our delivery drivers will request a valid, government-issued photo ID upon delivery if you appear to be under 25.</li>
              <li>If valid ID is not provided, the restricted items will be removed from your order and a partial refund (minus delivery fees) will be issued.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Ordering & Payments" icon={<ShoppingBag size={24} />}>
            <p>When you place an order, it constitutes an offer to purchase. A contract is only formed when the local store accepts your order.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Pricing:</strong> Prices are set by local stores and include VAT where applicable. Prices may vary from in-store pricing.</li>
              <li><strong>Substitutions:</strong> If an item is out of stock, the store may provide a suitable substitution of equal or greater value, unless you have opted out.</li>
              <li><strong>Payments:</strong> We accept major credit/debit cards and wallet credits. Your card is authorized at checkout and charged once the order is confirmed.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Delivery & Cancellation" icon={<Truck size={24} />}>
            <p>We aim to deliver within the estimated time window provided, but delays can occur due to weather, traffic, or store volume.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cancellation:</strong> You can cancel your order for a full refund up until the point the store begins preparing it. After this, a cancellation fee may apply.</li>
              <li><strong>Perishable Goods:</strong> Due to the nature of fresh groceries, the standard 14-day "cooling off" period for distance selling does not apply to perishable items.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Refunds & Returns" icon={<RefreshCw size={24} />}>
            <p>If you are unhappy with the quality of any item, please contact us within 24 hours of delivery.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refunds for damaged or missing items will be issued to your original payment method or as wallet credit.</li>
              <li>Returns of non-perishable goods are accepted within 14 days if the item is unopened and in its original packaging.</li>
            </ul>
          </LegalSection>

          <div className="mt-16 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4">
            <AlertCircle className="text-amber-600 shrink-0" size={24} />
            <p className="text-sm text-amber-900 leading-relaxed">
              <strong>Governing Law:</strong> These terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
