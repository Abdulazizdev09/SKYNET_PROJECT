/** Raw airport record as returned by the AirLabs `/airports` endpoint. */
export interface AirLabsAirport {
  airport_id?: number;
  iata_code: string | null;
  icao_code: string | null;
  name: string;
  lat: number;
  lng: number;
  country_code: string;
  city?: string | null;
  timezone?: string | null;
  is_major?: boolean | number | null;
}

/** Normalised airport used throughout the SkyNet UI and DSA graph. */
export interface Airport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  isMajor: boolean;
}
