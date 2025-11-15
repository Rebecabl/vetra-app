/**
 * Utilitários para códigos e bandeiras de países
 */

/**
 * Mapeia nome do país para código ISO
 */
export function getCountryCode(countryName: string): string {
  const codes: Record<string, string> = {
    "United States of America": "US",
    "United States": "US",
    "Brazil": "BR",
    "United Kingdom": "GB",
    "France": "FR",
    "Germany": "DE",
    "Spain": "ES",
    "Italy": "IT",
    "Canada": "CA",
    "Australia": "AU",
    "Japan": "JP",
    "China": "CN",
    "India": "IN",
    "Mexico": "MX",
    "Argentina": "AR",
  };
  return codes[countryName] || countryName.substring(0, 3).toUpperCase();
}

/**
 * Mapeia nome do país para emoji de bandeira
 */
export function getCountryFlag(countryName: string): string {
  const flags: Record<string, string> = {
    "United States of America": "🇺🇸",
    "United States": "🇺🇸",
    "Brazil": "🇧🇷",
    "United Kingdom": "🇬🇧",
    "France": "🇫🇷",
    "Germany": "🇩🇪",
    "Spain": "🇪🇸",
    "Italy": "🇮🇹",
    "Canada": "🇨🇦",
    "Australia": "🇦🇺",
    "Japan": "🇯🇵",
    "China": "🇨🇳",
    "India": "🇮🇳",
    "Mexico": "🇲🇽",
    "Argentina": "🇦🇷",
  };
  return flags[countryName] || "🌍";
}

