'use client';

import { useEffect } from 'react';

/**
 * Loads public/site.js after React has hydrated the page, so the script's DOM
 * changes (the typing composer, the staff reading) never race hydration.
 */
export function Enhance() {
  useEffect(() => {
    if (document.querySelector('script[data-site-js]')) return;
    const s = document.createElement('script');
    s.src = '/site.js';
    s.defer = true;
    s.dataset.siteJs = '';
    document.body.appendChild(s);
  }, []);
  return null;
}
