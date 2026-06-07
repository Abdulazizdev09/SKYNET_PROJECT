/**
 * Real-world direct routes between the 50 fallback airports, as undirected
 * IATA pairs. Edge weights (distance in km) are computed at graph-build time
 * from the airport coordinates. The network is deliberately dense and connected
 * so that Dijkstra produces multi-stop routes and the backtracking explorer
 * finds several alternatives.
 */
export const ROUTE_PAIRS: [string, string][] = [
  // North America
  ['JFK', 'ORD'], ['JFK', 'ATL'], ['JFK', 'MIA'], ['JFK', 'LAX'], ['JFK', 'YYZ'],
  ['ORD', 'LAX'], ['ORD', 'DFW'], ['ORD', 'SEA'], ['ORD', 'YYZ'],
  ['ATL', 'MIA'], ['ATL', 'DFW'], ['ATL', 'LAX'],
  ['DFW', 'LAX'], ['DFW', 'SFO'], ['LAX', 'SFO'], ['SFO', 'SEA'],
  ['MEX', 'LAX'], ['MEX', 'MIA'], ['MEX', 'BOG'],
  // Latin America
  ['MIA', 'BOG'], ['MIA', 'GRU'], ['BOG', 'LIM'], ['LIM', 'GRU'],
  ['GRU', 'EZE'], ['EZE', 'LIM'],
  // Transatlantic
  ['JFK', 'LHR'], ['JFK', 'CDG'], ['JFK', 'DXB'], ['ATL', 'AMS'],
  ['ORD', 'FRA'], ['MIA', 'MAD'], ['YYZ', 'LHR'], ['GRU', 'MAD'], ['EZE', 'MAD'],
  // Europe
  ['LHR', 'CDG'], ['LHR', 'AMS'], ['LHR', 'FRA'], ['CDG', 'FRA'], ['CDG', 'MAD'],
  ['MAD', 'BCN'], ['BCN', 'FCO'], ['FCO', 'MUC'], ['MUC', 'FRA'], ['FRA', 'ZRH'],
  ['ZRH', 'VIE'], ['VIE', 'IST'], ['AMS', 'CPH'], ['CPH', 'SVO'], ['FRA', 'SVO'],
  ['IST', 'SVO'], ['MAD', 'FCO'], ['AMS', 'MUC'], ['VIE', 'FRA'],
  // Europe ↔ Middle East / Central Asia
  ['LHR', 'DXB'], ['FRA', 'DXB'], ['IST', 'DXB'], ['IST', 'DOH'], ['DXB', 'DOH'],
  ['DXB', 'AUH'], ['DXB', 'DEL'], ['DXB', 'BOM'], ['DXB', 'TAS'], ['DOH', 'DEL'],
  ['AUH', 'DEL'], ['IST', 'TAS'], ['SVO', 'TAS'], ['FRA', 'DEL'], ['IST', 'CAI'],
  // Middle East ↔ Africa
  ['DXB', 'CAI'], ['DOH', 'NBO'], ['CAI', 'JNB'], ['NBO', 'JNB'], ['JNB', 'CPT'],
  ['CAI', 'TLV'], ['DXB', 'NBO'], ['TLV', 'IST'],
  // Asia
  ['DEL', 'BOM'], ['DEL', 'BKK'], ['BOM', 'SIN'], ['BKK', 'SIN'], ['SIN', 'KUL'],
  ['KUL', 'BKK'], ['SIN', 'HKG'], ['BKK', 'HKG'], ['HKG', 'PVG'], ['HKG', 'PEK'],
  ['PVG', 'PEK'], ['PEK', 'ICN'], ['PVG', 'NRT'], ['NRT', 'HND'], ['HND', 'ICN'],
  ['ICN', 'PEK'], ['SIN', 'PVG'], ['DEL', 'HKG'], ['TAS', 'DEL'], ['DXB', 'SIN'],
  ['DXB', 'HKG'], ['DOH', 'BKK'], ['DOH', 'SIN'],
  // Oceania
  ['SIN', 'SYD'], ['HKG', 'SYD'], ['SYD', 'MEL'], ['SYD', 'AKL'], ['MEL', 'AKL'],
  ['NRT', 'SYD'], ['SIN', 'MEL'],
  // Transpacific
  ['LAX', 'NRT'], ['LAX', 'HND'], ['SFO', 'ICN'], ['SFO', 'PVG'], ['SEA', 'ICN'],
  ['LAX', 'SYD'], ['JFK', 'PEK'], ['ORD', 'DOH'],
];
