/**
 * KMP — Knuth–Morris–Pratt string pattern matching.
 *
 * Used in SkyNet for: locating a passenger name inside large flight manifests.
 * The precomputed failure (LPS) table lets the search skip re-comparisons, so
 * the text pointer never moves backwards.
 *
 * Time complexity: O(m) to build the table, O(n + m) to search.
 * Space complexity: O(m) for the failure table.
 *
 * @example
 * KMP.search('ANNA ANNABEL', 'ANNA'); // [0, 5]
 */
export interface KmpResult {
  matches: number[];
  failureTable: number[];
  comparisons: number;
}

export class KMP {
  /**
   * Build the longest-proper-prefix-suffix (failure) table for a pattern.
   * Time: O(m)  Space: O(m)
   */
  static buildFailureTable(pattern: string): number[] {
    const lps = new Array<number>(pattern.length).fill(0);
    let length = 0;
    let i = 1;
    while (i < pattern.length) {
      if (pattern[i] === pattern[length]) {
        length++;
        lps[i] = length;
        i++;
      } else if (length > 0) {
        length = lps[length - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
    return lps;
  }

  /**
   * Return every start index where `pattern` occurs in `text`.
   * Time: O(n + m)  Space: O(m)
   */
  static search(text: string, pattern: string): number[] {
    const matches: number[] = [];
    if (pattern.length === 0 || text.length < pattern.length) return matches;
    const lps = KMP.buildFailureTable(pattern);
    let i = 0; // text pointer
    let j = 0; // pattern pointer
    while (i < text.length) {
      if (text[i] === pattern[j]) {
        i++;
        j++;
        if (j === pattern.length) {
          matches.push(i - j);
          j = lps[j - 1];
        }
      } else if (j > 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
    return matches;
  }

  /**
   * Search variant that also reports the failure table and a raw comparison
   * count — used by the Analytics UI to visualise the algorithm's efficiency.
   * Time: O(n + m)  Space: O(m)
   */
  static searchWithStats(text: string, pattern: string): KmpResult {
    if (pattern.length === 0) return { matches: [], failureTable: [], comparisons: 0 };
    const failureTable = KMP.buildFailureTable(pattern);
    const matches: number[] = [];
    let comparisons = 0;
    let i = 0;
    let j = 0;
    while (i < text.length) {
      comparisons++;
      if (text[i] === pattern[j]) {
        i++;
        j++;
        if (j === pattern.length) {
          matches.push(i - j);
          j = failureTable[j - 1];
        }
      } else if (j > 0) {
        j = failureTable[j - 1];
      } else {
        i++;
      }
    }
    return { matches, failureTable, comparisons };
  }
}
