import type { LatLngBoundsExpression } from 'leaflet';

export type ContinentId = 'all' | 'europe' | 'americas' | 'asia' | 'middleeast' | 'africa' | 'oceania';

export interface ContinentDef {
  id: ContinentId;
  label: string;
  emoji: string;
}

export const CONTINENTS: ContinentDef[] = [
  { id: 'all', label: 'All', emoji: '🌍' },
  { id: 'europe', label: 'Europe', emoji: '🌎' },
  { id: 'americas', label: 'Americas', emoji: '🌎' },
  { id: 'asia', label: 'Asia', emoji: '🌏' },
  { id: 'middleeast', label: 'Middle East', emoji: '🌏' },
  { id: 'africa', label: 'Africa', emoji: '🌍' },
  { id: 'oceania', label: 'Oceania', emoji: '🌏' },
];

/** ISO-2 country codes grouped by continent (used to scope AirLabs requests). */
export const CONTINENT_COUNTRIES: Record<Exclude<ContinentId, 'all'>, string[]> = {
  europe: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PT', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'BE', 'PL', 'CZ', 'HU', 'RO', 'GR', 'TR', 'UA', 'RU'],
  americas: ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC'],
  asia: ['CN', 'JP', 'KR', 'IN', 'SG', 'TH', 'VN', 'MY', 'ID', 'PH', 'HK', 'TW'],
  middleeast: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IL', 'JO', 'EG', 'IR', 'IQ'],
  africa: ['ZA', 'NG', 'KE', 'ET', 'GH', 'TZ', 'MA', 'EG', 'UG', 'SN'],
  oceania: ['AU', 'NZ', 'FJ', 'PG'],
};

/** Map view bounding boxes [[S,W],[N,E]] for flyToBounds. */
export const CONTINENT_BOUNDS: Record<Exclude<ContinentId, 'all'>, LatLngBoundsExpression> = {
  europe: [[34, -25], [72, 45]],
  americas: [[-56, -130], [72, -30]],
  asia: [[-10, 60], [55, 150]],
  middleeast: [[12, 25], [42, 65]],
  africa: [[-35, -20], [38, 55]],
  oceania: [[-50, 110], [0, 180]],
};

export const WORLD_BOUNDS: LatLngBoundsExpression = [[-58, -170], [75, 175]];

/** Human-readable country names for the filter dropdown. */
export const COUNTRY_NAMES: Record<string, string> = {
  GB: 'United Kingdom', DE: 'Germany', FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
  PT: 'Portugal', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', CH: 'Switzerland',
  AT: 'Austria', BE: 'Belgium', PL: 'Poland', CZ: 'Czechia', HU: 'Hungary', RO: 'Romania',
  GR: 'Greece', TR: 'Türkiye', UA: 'Ukraine', RU: 'Russia',
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina', CO: 'Colombia',
  CL: 'Chile', PE: 'Peru', VE: 'Venezuela', EC: 'Ecuador',
  CN: 'China', JP: 'Japan', KR: 'South Korea', IN: 'India', SG: 'Singapore', TH: 'Thailand',
  VN: 'Vietnam', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines', HK: 'Hong Kong', TW: 'Taiwan',
  AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain', OM: 'Oman',
  IL: 'Israel', JO: 'Jordan', EG: 'Egypt', IR: 'Iran', IQ: 'Iraq',
  ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', ET: 'Ethiopia', GH: 'Ghana', TZ: 'Tanzania',
  MA: 'Morocco', UG: 'Uganda', SN: 'Senegal',
  AU: 'Australia', NZ: 'New Zealand', FJ: 'Fiji', PG: 'Papua New Guinea',
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}
