'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/strings';

const STORAGE_KEY = 'flatx.locale';

function loadLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'en' || v === 'hi' || v === 'mr') return v;
  return DEFAULT_LOCALE;
}

/**
 * Compact locale switcher. Persists to localStorage + sets <html lang>.
 * Full string extraction is tracked separately as #27.
 */
export function LanguageToggle() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const initial = loadLocale();
    setLocale(initial);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initial;
    }
  }, []);

  function choose(code: Locale) {
    setLocale(code);
    setOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, code);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
    }
  }

  const active = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 bg-white"
      >
        🌐 {active.nativeLabel}
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-sm text-sm z-20 min-w-[120px]"
        >
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => choose(l.code)}
                role="option"
                aria-selected={l.code === locale}
                className={[
                  'w-full text-left px-3 py-1.5 hover:bg-slate-50',
                  l.code === locale ? 'font-semibold text-slate-900' : 'text-slate-600',
                ].join(' ')}
              >
                {l.nativeLabel}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
