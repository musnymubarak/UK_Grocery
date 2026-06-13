/**
 * LegalPageView — renders an admin-authored legal page (markdown) when one exists,
 * otherwise the built-in hardcoded `fallback`. The fallback renders immediately
 * (no blank flash); it's only replaced if the CMS returns a non-empty body.
 */
import { useEffect, useState, ReactNode } from 'react';
import Layout from './Layout';
import Markdown from './Markdown';
import { catalogApi } from '../services/api';

interface LegalPage { title: string; body: string; updated_at: string | null }

export default function LegalPageView({ slug, defaultTitle, fallback }: { slug: string; defaultTitle: string; fallback: ReactNode }) {
  const [page, setPage] = useState<LegalPage | null>(null);

  useEffect(() => {
    let active = true;
    catalogApi.getLegalPage(slug)
      .then((res) => { if (active) setPage(res.data as LegalPage); })
      .catch(() => { /* keep fallback */ });
    return () => { active = false; };
  }, [slug]);

  if (!page || !page.body || !page.body.trim()) return <>{fallback}</>;

  const title = page.title || defaultTitle;
  return (
    <Layout title={title} showBack>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 pb-32">
        <header className="mb-10 md:mb-12 text-center">
          <h1 className="font-headline font-extrabold text-[34px] md:text-[52px] leading-[1.1] tracking-tight text-primary mb-3">{title}</h1>
          {page.updated_at && (
            <p className="text-sm text-on-surface-variant">
              Last updated {new Date(page.updated_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </header>
        <article><Markdown source={page.body} /></article>
      </div>
    </Layout>
  );
}
