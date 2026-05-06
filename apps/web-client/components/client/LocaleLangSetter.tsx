'use client';

import { useEffect } from 'react';

/** Sets the lang attribute on <html> dynamically from the locale */
export function LocaleLangSetter({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
