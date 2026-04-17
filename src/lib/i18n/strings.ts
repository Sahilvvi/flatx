// Minimal ambient-ready i18n dictionary. The full Hindi/Marathi string
// extraction is tracked as #27 in the 33-feature matrix. This file ships the
// header/nav labels so the LanguageToggle component has something real to
// switch between today, and gives future PRs a clean place to add keys.

export type Locale = 'en' | 'hi' | 'mr';

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALES: Array<{ code: Locale; label: string; nativeLabel: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

type Dict = Record<string, string>;

const en: Dict = {
  'nav.map': 'Map',
  'nav.rent_check': 'Rent check',
  'nav.match': 'Match',
  'nav.list': '+ List',
  'nav.sign_in': 'Sign in',
  'nav.discover': 'Discover',
};

const hi: Dict = {
  'nav.map': 'नक़्शा',
  'nav.rent_check': 'किराया जाँच',
  'nav.match': 'मिलान',
  'nav.list': '+ सूची',
  'nav.sign_in': 'साइन इन',
  'nav.discover': 'खोजें',
};

const mr: Dict = {
  'nav.map': 'नकाशा',
  'nav.rent_check': 'भाडे तपासा',
  'nav.match': 'जुळवा',
  'nav.list': '+ यादी',
  'nav.sign_in': 'साइन इन',
  'nav.discover': 'शोधा',
};

const DICTS: Record<Locale, Dict> = { en, hi, mr };

export function t(locale: Locale, key: string): string {
  return DICTS[locale]?.[key] ?? DICTS.en[key] ?? key;
}
