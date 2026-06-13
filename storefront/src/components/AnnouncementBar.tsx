/**
 * AnnouncementBar — admin-controlled promo strip at the very top of every page.
 * Driven by the `announcement` object on /storefront/app-config (schedule-gated
 * server-side). Dismissal is remembered per-content (keyed by `announcement.key`),
 * so editing the message re-shows it to users who dismissed the previous one.
 */
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useContent } from '../context/ContentContext';

const VARIANT: Record<string, string> = {
  info: 'bg-info text-white',
  success: 'bg-success text-white',
  warning: 'bg-warning text-on-surface',
  promo: 'bg-action-red text-white',
};

const DISMISS_KEY = 'dismissed_announcement';

export default function AnnouncementBar() {
  const { announcement } = useContent();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  useEffect(() => {
    try { setDismissedKey(localStorage.getItem(DISMISS_KEY)); } catch { /* ignore */ }
  }, []);

  if (!announcement) return null;
  if (announcement.dismissible && dismissedKey === announcement.key) return null;

  const { message, link_url, link_label, variant, dismissible, key } = announcement;
  const styles = VARIANT[variant] ?? VARIANT.info;
  const isExternal = /^https?:\/\//i.test(link_url);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, key); } catch { /* ignore */ }
    setDismissedKey(key);
  };

  const cta = link_url ? (
    isExternal ? (
      <a href={link_url} target="_blank" rel="noopener noreferrer" className="underline font-bold whitespace-nowrap hover:opacity-80">
        {link_label || 'Learn more'} →
      </a>
    ) : (
      <Link to={link_url} className="underline font-bold whitespace-nowrap hover:opacity-80">
        {link_label || 'Learn more'} →
      </Link>
    )
  ) : null;

  return (
    <div className={`${styles} w-full text-sm font-semibold`}>
      <div className="max-w-[90rem] mx-auto flex items-center justify-center gap-3 px-10 py-2 relative">
        <div className="flex items-center gap-3 flex-wrap justify-center text-center">
          <span>{message}</span>
          {cta}
        </div>
        {dismissible && (
          <button
            onClick={dismiss}
            aria-label="Dismiss announcement"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
