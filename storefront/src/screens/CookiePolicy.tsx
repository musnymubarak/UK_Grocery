import React from 'react';
import Layout from '../components/Layout';
import { motion } from 'motion/react';
import { Database, Info, Settings, ShieldCheck, HelpCircle } from 'lucide-react';

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

export default function CookiePolicy() {
  return (
    <Layout title="Cookies & Local Storage" showBack>
      <div className="max-w-4xl mx-auto px-6 py-16 pb-32">
        <header className="mb-16 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Database size={14} /> Data Storage Transparency
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-on-surface mb-6">
            Cookies & <span className="text-primary">Storage</span>
          </h1>
          <p className="text-on-surface-variant text-lg font-medium max-w-2xl mx-auto">
            This policy explains how we use Local Storage and Cookies to make our storefront work efficiently for you.
          </p>
        </header>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-8 md:p-12 shadow-sm">
          <LegalSection title="What We Use" icon={<Settings size={24} />}>
            <p>Unlike many websites, Daily Grocer primarily uses <strong>Web Browser Local Storage</strong> instead of traditional HTTP Cookies for core functionality. Local Storage allows us to store data directly on your device with more efficiency and privacy.</p>
            <p>We do not use any third-party tracking cookies or advertising pixels.</p>
          </LegalSection>

          <LegalSection title="Essential Storage Items" icon={<ShieldCheck size={24} />}>
            <p>These items are technically necessary for the operation of the website and cannot be switched off:</p>
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-high text-left">
                    <th className="p-3 border border-outline-variant/30 font-bold">Key</th>
                    <th className="p-3 border border-outline-variant/30 font-bold">Purpose</th>
                    <th className="p-3 border border-outline-variant/30 font-bold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  <tr>
                    <td className="p-3 border border-outline-variant/30 font-mono text-xs">customer_token</td>
                    <td className="p-3 border border-outline-variant/30">Keeps you signed in to your account.</td>
                    <td className="p-3 border border-outline-variant/30">Until Logout</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-outline-variant/30 font-mono text-xs">dg_cart</td>
                    <td className="p-3 border border-outline-variant/30">Remembers the items in your shopping basket.</td>
                    <td className="p-3 border border-outline-variant/30">Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-outline-variant/30 font-mono text-xs">selected_store</td>
                    <td className="p-3 border border-outline-variant/30">Remembers which local store you are shopping from.</td>
                    <td className="p-3 border border-outline-variant/30">Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-outline-variant/30 font-mono text-xs">dg_consent_given</td>
                    <td className="p-3 border border-outline-variant/30">Remembers your acceptance of this policy.</td>
                    <td className="p-3 border border-outline-variant/30">1 Year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </LegalSection>

          <LegalSection title="How to Manage Storage" icon={<HelpCircle size={24} />}>
            <p>You can clear your local storage at any time through your browser settings. However, doing so will sign you out and empty your current shopping basket.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data.</li>
              <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data.</li>
              <li><strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data.</li>
            </ul>
          </LegalSection>

          <div className="mt-16 p-8 bg-surface-container rounded-2xl flex items-start gap-6 border border-outline-variant/30">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0"><Info size={24} /></div>
            <div>
              <h4 className="font-bold text-lg mb-2">Privacy First</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                By using Local Storage for sessions and baskets, we minimize the amount of data sent to our servers in every request header, improving both performance and security for our UK customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
