import React from 'react';
import Layout from '../components/Layout';
import LegalPageView from '../components/LegalPageView';
import { motion } from 'motion/react';
import { Database, Info, Settings, ShieldCheck, HelpCircle } from 'lucide-react';

interface LegalSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const LegalSection = ({ title, icon, children }: LegalSectionProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="mb-12 border-b border-outline-variant/20 pb-12 last:border-0 last:pb-0"
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-primary/5 text-primary border border-primary/10 rounded-2xl shrink-0 shadow-sm">
        {icon}
      </div>
      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-primary">{title}</h2>
    </div>
    <div className="text-on-surface-variant text-[15px] md:text-[16px] leading-[1.6] space-y-4 font-medium">
      {children}
    </div>
  </motion.div>
);

function CookieFallback() {
  return (
    <Layout title="Cookies & Local Storage" showBack>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 pb-32">
        <header className="mb-12 md:mb-16 text-center">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/5 text-secondary border border-secondary/15 rounded-full text-xs font-bold uppercase tracking-wider mb-6 shadow-sm"
          >
            <Database size={14} className="stroke-[2.5]" /> Data Storage Transparency
          </motion.div>
          <h1 className="font-headline font-extrabold text-[36px] md:text-[56px] leading-[1.1] tracking-tight text-primary mb-4">
            Cookies & <span className="text-[#005eb8]">Storage</span>
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            This policy explains how we use Local Storage and Cookies to make our storefront work efficiently for you.
          </p>
        </header>

        <div className="bg-white border border-outline-variant/30 rounded-[2rem] p-6 md:p-12 shadow-sm">
          <LegalSection title="What We Use" icon={<Settings size={24} className="stroke-[2.2]" />}>
            <p>Unlike many websites, Daily Grocer primarily uses <strong>Web Browser Local Storage</strong> instead of traditional HTTP Cookies for core functionality. Local Storage allows us to store data directly on your device with more efficiency and privacy.</p>
            <p>We do not use any third-party tracking cookies or advertising pixels.</p>
          </LegalSection>

          <LegalSection title="Essential Storage Items" icon={<ShieldCheck size={24} className="stroke-[2.2]" />}>
            <p>These items are technically necessary for the operation of the website and cannot be switched off:</p>
            <div className="overflow-x-auto mt-6 border border-outline-variant/20 rounded-2xl shadow-sm">
              <table className="w-full text-sm border-collapse bg-white">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-left">
                    <th className="p-4 text-primary font-bold text-xs uppercase tracking-wider">Key</th>
                    <th className="p-4 text-primary font-bold text-xs uppercase tracking-wider">Purpose</th>
                    <th className="p-4 text-primary font-bold text-xs uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-on-surface-variant font-medium">
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-[#005eb8] font-bold">customer_token</td>
                    <td className="p-4">Keeps you signed in to your account.</td>
                    <td className="p-4">Until Logout</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-[#005eb8] font-bold">dg_cart</td>
                    <td className="p-4">Remembers the items in your shopping basket.</td>
                    <td className="p-4">Persistent</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-[#005eb8] font-bold">selected_store</td>
                    <td className="p-4">Remembers which local store you are shopping from.</td>
                    <td className="p-4">Persistent</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-[#005eb8] font-bold">dg_consent_given</td>
                    <td className="p-4">Remembers your acceptance of this policy.</td>
                    <td className="p-4">1 Year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </LegalSection>

          <LegalSection title="How to Manage Storage" icon={<HelpCircle size={24} className="stroke-[2.2]" />}>
            <p>You can clear your local storage at any time through your browser settings. However, doing so will sign you out and empty your current shopping basket.</p>
            <ul className="list-disc pl-6 space-y-3 text-on-surface-variant/90">
              <li><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data.</li>
              <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data.</li>
              <li><strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data.</li>
            </ul>
          </LegalSection>

          <div className="mt-12 p-6 md:p-8 bg-[#F8FAFC] border border-outline-variant/20 rounded-[1.5rem] flex items-start gap-5 shadow-sm">
            <div className="p-3 bg-primary/5 text-primary border border-primary/10 rounded-xl shrink-0"><Info size={24} className="stroke-[2.2]" /></div>
            <div>
              <h4 className="font-headline font-bold text-lg text-primary mb-2">Privacy First</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                By using Local Storage for sessions and baskets, we minimize the amount of data sent to our servers in every request header, improving both performance and security for our UK customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function CookiePolicy() {
  return <LegalPageView slug="cookies" defaultTitle="Cookie Policy" fallback={<CookieFallback />} />;
}
