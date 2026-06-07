import type { Airport } from '../types/airport';

/**
 * Built-in dataset of 50 major world airports (real IATA/ICAO codes and
 * coordinates). Used as the offline fallback when the AirLabs API is
 * unavailable or rate-limited, and as the backbone of the DSA flight graph.
 */
const RAW_AIRPORTS = [
  { iata: 'JFK', icao: 'KJFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'United States', countryCode: 'US', lat: 40.6413, lng: -73.7781 },
  { iata: 'LAX', icao: 'KLAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'United States', countryCode: 'US', lat: 33.9416, lng: -118.4085 },
  { iata: 'ORD', icao: 'KORD', name: "Chicago O'Hare Intl", city: 'Chicago', country: 'United States', countryCode: 'US', lat: 41.9742, lng: -87.9073 },
  { iata: 'ATL', icao: 'KATL', name: 'Hartsfield–Jackson Atlanta Intl', city: 'Atlanta', country: 'United States', countryCode: 'US', lat: 33.6407, lng: -84.4277 },
  { iata: 'SFO', icao: 'KSFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.6213, lng: -122.379 },
  { iata: 'MIA', icao: 'KMIA', name: 'Miami Intl', city: 'Miami', country: 'United States', countryCode: 'US', lat: 25.7959, lng: -80.287 },
  { iata: 'DFW', icao: 'KDFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas', country: 'United States', countryCode: 'US', lat: 32.8998, lng: -97.0403 },
  { iata: 'SEA', icao: 'KSEA', name: 'Seattle–Tacoma Intl', city: 'Seattle', country: 'United States', countryCode: 'US', lat: 47.4502, lng: -122.3088 },
  { iata: 'YYZ', icao: 'CYYZ', name: 'Toronto Pearson Intl', city: 'Toronto', country: 'Canada', countryCode: 'CA', lat: 43.6777, lng: -79.6248 },
  { iata: 'MEX', icao: 'MMMX', name: 'Mexico City Intl', city: 'Mexico City', country: 'Mexico', countryCode: 'MX', lat: 19.4361, lng: -99.0719 },
  { iata: 'GRU', icao: 'SBGR', name: 'São Paulo–Guarulhos Intl', city: 'São Paulo', country: 'Brazil', countryCode: 'BR', lat: -23.4356, lng: -46.4731 },
  { iata: 'BOG', icao: 'SKBO', name: 'El Dorado Intl', city: 'Bogotá', country: 'Colombia', countryCode: 'CO', lat: 4.7016, lng: -74.1469 },
  { iata: 'EZE', icao: 'SAEZ', name: 'Ministro Pistarini Intl', city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', lat: -34.8222, lng: -58.5358 },
  { iata: 'LIM', icao: 'SPJC', name: 'Jorge Chávez Intl', city: 'Lima', country: 'Peru', countryCode: 'PE', lat: -12.0219, lng: -77.1143 },
  { iata: 'LHR', icao: 'EGLL', name: 'London Heathrow', city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.47, lng: -0.4543 },
  { iata: 'CDG', icao: 'LFPG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', countryCode: 'FR', lat: 49.0097, lng: 2.5479 },
  { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', lat: 52.3105, lng: 4.7683 },
  { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt am Main', city: 'Frankfurt', country: 'Germany', countryCode: 'DE', lat: 50.0379, lng: 8.5622 },
  { iata: 'MAD', icao: 'LEMD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', country: 'Spain', countryCode: 'ES', lat: 40.4983, lng: -3.5676 },
  { iata: 'BCN', icao: 'LEBL', name: 'Barcelona–El Prat', city: 'Barcelona', country: 'Spain', countryCode: 'ES', lat: 41.2974, lng: 2.0833 },
  { iata: 'FCO', icao: 'LIRF', name: 'Rome Fiumicino', city: 'Rome', country: 'Italy', countryCode: 'IT', lat: 41.8003, lng: 12.2389 },
  { iata: 'MUC', icao: 'EDDM', name: 'Munich Airport', city: 'Munich', country: 'Germany', countryCode: 'DE', lat: 48.3538, lng: 11.7861 },
  { iata: 'ZRH', icao: 'LSZH', name: 'Zürich Airport', city: 'Zürich', country: 'Switzerland', countryCode: 'CH', lat: 47.4647, lng: 8.5492 },
  { iata: 'VIE', icao: 'LOWW', name: 'Vienna Intl', city: 'Vienna', country: 'Austria', countryCode: 'AT', lat: 48.1103, lng: 16.5697 },
  { iata: 'CPH', icao: 'EKCH', name: 'Copenhagen Kastrup', city: 'Copenhagen', country: 'Denmark', countryCode: 'DK', lat: 55.618, lng: 12.6508 },
  { iata: 'IST', icao: 'LTFM', name: 'Istanbul Airport', city: 'Istanbul', country: 'Türkiye', countryCode: 'TR', lat: 41.2753, lng: 28.7519 },
  { iata: 'SVO', icao: 'UUEE', name: 'Sheremetyevo Intl', city: 'Moscow', country: 'Russia', countryCode: 'RU', lat: 55.9726, lng: 37.4146 },
  { iata: 'DXB', icao: 'OMDB', name: 'Dubai Intl', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2532, lng: 55.3657 },
  { iata: 'DOH', icao: 'OTHH', name: 'Hamad Intl', city: 'Doha', country: 'Qatar', countryCode: 'QA', lat: 25.2731, lng: 51.608 },
  { iata: 'AUH', icao: 'OMAA', name: 'Abu Dhabi Intl', city: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', lat: 24.433, lng: 54.6511 },
  { iata: 'TLV', icao: 'LLBG', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel', countryCode: 'IL', lat: 32.0114, lng: 34.8867 },
  { iata: 'CAI', icao: 'HECA', name: 'Cairo Intl', city: 'Cairo', country: 'Egypt', countryCode: 'EG', lat: 30.1219, lng: 31.4056 },
  { iata: 'JNB', icao: 'FAOR', name: 'O. R. Tambo Intl', city: 'Johannesburg', country: 'South Africa', countryCode: 'ZA', lat: -26.1392, lng: 28.246 },
  { iata: 'CPT', icao: 'FACT', name: 'Cape Town Intl', city: 'Cape Town', country: 'South Africa', countryCode: 'ZA', lat: -33.969, lng: 18.6021 },
  { iata: 'NBO', icao: 'HKJK', name: 'Jomo Kenyatta Intl', city: 'Nairobi', country: 'Kenya', countryCode: 'KE', lat: -1.3192, lng: 36.9278 },
  { iata: 'DEL', icao: 'VIDP', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'India', countryCode: 'IN', lat: 28.5562, lng: 77.1 },
  { iata: 'BOM', icao: 'VABB', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.0896, lng: 72.8656 },
  { iata: 'TAS', icao: 'UTTT', name: 'Tashkent Intl', city: 'Tashkent', country: 'Uzbekistan', countryCode: 'UZ', lat: 41.2579, lng: 69.2812 },
  { iata: 'KUL', icao: 'WMKK', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', lat: 2.7456, lng: 101.7099 },
  { iata: 'SIN', icao: 'WSSS', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.3644, lng: 103.9915 },
  { iata: 'BKK', icao: 'VTBS', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', countryCode: 'TH', lat: 13.69, lng: 100.7501 },
  { iata: 'HKG', icao: 'VHHH', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', lat: 22.308, lng: 113.9185 },
  { iata: 'PEK', icao: 'ZBAA', name: 'Beijing Capital Intl', city: 'Beijing', country: 'China', countryCode: 'CN', lat: 40.0799, lng: 116.6031 },
  { iata: 'PVG', icao: 'ZSPD', name: 'Shanghai Pudong Intl', city: 'Shanghai', country: 'China', countryCode: 'CN', lat: 31.1443, lng: 121.8083 },
  { iata: 'NRT', icao: 'RJAA', name: 'Tokyo Narita Intl', city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.772, lng: 140.3929 },
  { iata: 'HND', icao: 'RJTT', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.5494, lng: 139.7798 },
  { iata: 'ICN', icao: 'RKSI', name: 'Incheon Intl', city: 'Seoul', country: 'South Korea', countryCode: 'KR', lat: 37.4602, lng: 126.4407 },
  { iata: 'SYD', icao: 'YSSY', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.9399, lng: 151.1753 },
  { iata: 'MEL', icao: 'YMML', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', countryCode: 'AU', lat: -37.669, lng: 144.841 },
  { iata: 'AKL', icao: 'NZAA', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', countryCode: 'NZ', lat: -37.0082, lng: 174.785 },
];

/** All built-in airports are major hubs. */
export const FALLBACK_AIRPORTS: Airport[] = RAW_AIRPORTS.map((a) => ({ ...a, isMajor: true }));
