export const CONSENT_KEY = 'dg_consent_given';
export const CONSENT_CHANGED_EVENT = 'cookie_consent_changed';

export type ConsentStatus = 'accepted' | 'rejected' | null;

export function getConsentStatus(): ConsentStatus {
  const value = localStorage.getItem(CONSENT_KEY);
  return value === 'accepted' || value === 'rejected' ? value : null;
}

export function setConsentStatus(status: 'accepted' | 'rejected') {
  localStorage.setItem(CONSENT_KEY, status);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: status }));
}
