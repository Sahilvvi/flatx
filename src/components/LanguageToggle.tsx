'use client';

import { useState } from 'react';

const DICTIONARY = {
  en: { map: 'Map', list: 'List', filters: 'Filters', search: 'Search' },
  hi: { map: 'नक्शा', list: 'सूची', filters: 'फ़िल्टर', search: 'खोजें' },
  mr: { map: 'नकाशा', list: 'यादी', filters: 'फिल्टर', search: 'शोधा' },
};

export type Lang = 'en' | 'hi' | 'mr';

export function LanguageToggle() {
  const [lang, setLang] = useState<Lang>('en');

  return (
    <div className="flex bg-white shadow-sm border border-slate-200 rounded-full p-1 text-xs font-medium">
      {(['en', 'hi', 'mr'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1 rounded-full transition-colors ${
            lang === l ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'मराठी'}
        </button>
      ))}
    </div>
  );
}
