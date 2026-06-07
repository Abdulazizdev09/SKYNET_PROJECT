import { mulberry32, pick } from '../utils/random';

export const FIRST_NAMES = [
  'Aziz', 'Dilnoza', 'James', 'Maria', 'Chen', 'Aarav', 'Sofia', 'Omar', 'Yuki', 'Liam',
  'Emma', 'Noah', 'Olivia', 'Ibrahim', 'Fatima', 'Hiroshi', 'Elena', 'David', 'Sara', 'Ravi',
  'Anna', 'Marco', 'Priya', 'Lucas', 'Mei', 'Kofi', 'Ingrid', 'Diego', 'Aisha', 'Tomas',
  'Nadia', 'Sven', 'Leila', 'Hassan', 'Grace', 'Pedro', 'Yara', 'Viktor', 'Amara', 'Jin',
];

export const LAST_NAMES = [
  'Karimov', 'Petrova', 'Smith', 'Garcia', 'Wang', 'Sharma', 'Rossi', 'Hassan', 'Tanaka', 'Brown',
  'Johnson', 'Muller', 'Ali', 'Kim', 'Lopez', 'Nakamura', 'Ivanov', 'Cohen', 'Reddy', 'Yusupov',
  'Andersson', 'Costa', 'Patel', 'Dubois', 'Khan', 'Okafor', 'Novak', 'Silva', 'Haddad', 'Park',
  'Fischer', 'Moreau', 'Mensah', 'Larsson', 'Romano', 'Nguyen', 'Abdullah', 'Sato', 'Volkov', 'Castro',
];

/** A flat manifest of "First Last" names for the KMP search demo. */
export function generateManifest(count = 500, seed = 13): string[] {
  const rng = mulberry32(seed);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(`${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`);
  }
  return out;
}
