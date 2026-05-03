import React from 'react';
import Layout from '../components/Layout';
import { motion } from 'motion/react';
import { Shield, FileText, Lock, Globe, Mail, Phone } from 'lucide-react';

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

export default function PrivacyPolicy() {
  return (
    <Layout title="Privacy Policy" showBack>
      <div className="max-w-4xl mx-auto px-6 py-16 pb-32">
        <header className="mb-16 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Shield size={14} /> UK GDPR Compliant
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-on-surface mb-6">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-on-surface-variant text-lg font-medium max-w-2xl mx-auto">
            Last updated: May 2026. This policy explains how Daily Grocer collects, uses, and protects your personal data in accordance with UK laws.
          </p>
        </header>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-8 md:p-12 shadow-sm">
          <LegalSection title="Data Collection" icon={<FileText size={24} />}>
            <p>We collect personal information that you provide directly to us when you create an account, place an order, or contact our support team. This includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contact Information:</strong> Name, email address, phone number, and delivery addresses.</li>
              <li><strong>Verification Data:</strong> Date of birth (required for age-restricted items and legal compliance).</li>
              <li><strong>Transaction Data:</strong> Details about payments to and from you and other details of products you have purchased from us.</li>
              <li><strong>Technical Data:</strong> IP address, login data, browser type, and time zone setting.</li>
            </ul>
          </LegalSection>

          <LegalSection title="How We Use Your Data" icon={<Globe size={24} />}>
            <p>Your data is used primarily to fulfill your grocery orders and provide a personalized shopping experience. Specifically:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To register you as a new customer and manage your account.</li>
              <li>To process and deliver your orders, including managing payments, fees, and charges.</li>
              <li>To verify your age for restricted items (e.g., alcohol, tobacco) at the point of purchase and delivery.</li>
              <li>To manage our relationship with you, including notifying you about changes to our terms or privacy policy.</li>
              <li>To administer and protect our business and this website.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Data Sharing" icon={<Lock size={24} />}>
            <p>We do not sell your personal data. We share your information only with trusted third parties necessary for our operations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Delivery partners, payment processors (e.g., Stripe), and cloud hosting providers.</li>
              <li><strong>Store Partners:</strong> Individual local stores to prepare and fulfill your orders.</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Your Rights" icon={<Shield size={24} />}>
            <p>Under the UK GDPR, you have significant rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request that we correct any incomplete or inaccurate data.</li>
              <li><strong>Erasure:</strong> Request that we delete your personal data (the "Right to be Forgotten").</li>
              <li><strong>Portability:</strong> Request the transfer of your personal data to you or a third party.</li>
            </ul>
            <p className="mt-4">You can exercise these rights directly through your <strong>Profile</strong> page or by contacting our Data Protection Officer.</p>
          </LegalSection>

          <div className="mt-16 pt-12 border-t border-outline-variant/30 text-center">
            <h3 className="font-bold text-lg mb-4">Contact Our Privacy Team</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="mailto:privacy@dailygrocer.co.uk" className="flex items-center gap-2 text-primary font-bold hover:underline">
                <Mail size={18} /> privacy@dailygrocer.co.uk
              </a>
              <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                <Phone size={18} /> +44 20 7946 0000
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
