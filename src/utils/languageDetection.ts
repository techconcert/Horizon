/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type AppLanguage = 'English' | 'Español' | 'Português';

/**
 * Intelligently deduces the user's preferred language based on:
 * 1. Previously saved preference in localStorage
 * 2. Primary browser language (navigator.languages / navigator.language)
 * 3. Geographic region / system timezone (Intl.DateTimeFormat().resolvedOptions().timeZone)
 * 4. Locale formatting preferences (Intl.DateTimeFormat().resolvedOptions().locale)
 * 5. Secondary browser languages in preference list
 * 
 * Falls back to 'English' if no Portuguese or Spanish markers are deduced.
 */
export const detectDefaultLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return 'English';

  try {
    // 1. Stored user choice always takes highest precedence
    const saved = localStorage.getItem('language');
    if (saved === 'English' || saved === 'Español' || saved === 'Português') {
      return saved;
    }

    // Collect all browser language candidates in order
    const navLangs: string[] = [];
    if (Array.isArray(navigator.languages)) {
      navLangs.push(...navigator.languages);
    }
    if (navigator.language) {
      navLangs.push(navigator.language);
    }
    const legacyUserLang = (navigator as unknown as { userLanguage?: string; browserLanguage?: string }).userLanguage;
    if (legacyUserLang) {
      navLangs.push(legacyUserLang);
    }

    // 2. Primary browser language check
    if (navLangs.length > 0) {
      const primary = navLangs[0].toLowerCase().trim();
      if (primary.startsWith('pt')) return 'Português';
      if (primary.startsWith('es')) return 'Español';
    }

    // 3. Timezone / Geographic Region deduction
    try {
      const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();

      const ptRegions = [
        'sao_paulo', 'fortaleza', 'recife', 'belem', 'manaus', 'cuiaba',
        'porto_velho', 'rio_branco', 'noronha', 'araguaina', 'maceio', 'bahia',
        'santarem', 'campo_grande', 'boa_vista', 'brazil', 'lisbon', 'madeira',
        'azores', 'portugal', 'luanda', 'maputo', 'cape_verde', 'bissau',
        'sao_tome', 'dili'
      ];
      if (ptRegions.some(reg => tz.includes(reg))) {
        return 'Português';
      }

      const esRegions = [
        'madrid', 'canary', 'ceuta', 'mexico', 'cancun', 'merida', 'monterrey',
        'mazatlan', 'chihuahua', 'hermosillo', 'tijuana', 'bahia_banderas',
        'matamoros', 'ojinaga', 'buenos_aires', 'argentina', 'cordoba', 'jujuy',
        'mendoza', 'catamarca', 'la_rioja', 'san_juan', 'tucuman', 'ushuaia',
        'bogota', 'santiago', 'easter', 'lima', 'caracas', 'guayaquil',
        'galapagos', 'guatemala', 'havana', 'la_paz', 'santo_domingo',
        'tegucigalpa', 'asuncion', 'el_salvador', 'managua', 'costa_rica',
        'panama', 'puerto_rico', 'montevideo'
      ];
      if (esRegions.some(reg => tz.includes(reg))) {
        return 'Español';
      }
    } catch {
      // ignore timezone resolution error
    }

    // 4. Check all other secondary languages in browser preference list
    for (const lang of navLangs) {
      const code = lang.toLowerCase().trim();
      if (code.startsWith('pt')) return 'Português';
      if (code.startsWith('es')) return 'Español';
    }

    // 5. System Intl locale check
    try {
      const locale = (Intl.DateTimeFormat().resolvedOptions().locale || '').toLowerCase();
      if (locale.startsWith('pt')) return 'Português';
      if (locale.startsWith('es')) return 'Español';
    } catch {
      // ignore
    }
  } catch (err) {
    console.error('Error deducing default language:', err);
  }

  return 'English';
};
