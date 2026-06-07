/**
 * Sorting — QuickSort and MergeSort implemented from scratch.
 *
 * Used in SkyNet for: ordering daily flight schedules by departure time. Both
 * algorithms are offered so the Analytics view can race them and compare their
 * comparison / swap counts and wall-clock time (LO4 — performance evaluation).
 *
 * - QuickSort: in-place, O(n log n) average, O(n^2) worst (sorted input + last
 *   pivot), O(log n) auxiliary stack.
 * - MergeSort: stable, guaranteed O(n log n), O(n) auxiliary space.
 *
 * The generic `quickSort`/`mergeSort` accept any comparator. The `*Steps`
 * variants operate on numbers and additionally record per-operation frames so
 * the UI can animate the sort.
 */
export interface SortStats {
  comparisons: number;
  swaps: number;
  arrayAccesses: number;
}

export interface SortFrame {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
}

export interface SortRun {
  sorted: number[];
  stats: SortStats;
  frames: SortFrame[];
}

export class Sorting {
  /**
   * QuickSort (Lomuto partition) on a copy of the input.
   * Time: O(n log n) average / O(n^2) worst  Space: O(log n)
   */
  static quickSort<T>(input: T[], compare: (a: T, b: T) => number): T[] {
    const arr = [...input];
    Sorting.quick(arr, 0, arr.length - 1, compare);
    return arr;
  }

  private static quick<T>(arr: T[], lo: number, hi: number, compare: (a: T, b: T) => number): void {
    if (lo >= hi) return;
    const pivot = arr[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (compare(arr[j], pivot) <= 0) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    Sorting.quick(arr, lo, i - 1, compare);
    Sorting.quick(arr, i + 1, hi, compare);
  }

  /**
   * MergeSort (stable) returning a sorted copy.
   * Time: O(n log n) always  Space: O(n)
   */
  static mergeSort<T>(input: T[], compare: (a: T, b: T) => number): T[] {
    if (input.length <= 1) return [...input];
    const mid = input.length >> 1;
    const left = Sorting.mergeSort(input.slice(0, mid), compare);
    const right = Sorting.mergeSort(input.slice(mid), compare);
    return Sorting.merge(left, right, compare);
  }

  private static merge<T>(left: T[], right: T[], compare: (a: T, b: T) => number): T[] {
    const out: T[] = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (compare(left[i], right[j]) <= 0) out.push(left[i++]);
      else out.push(right[j++]);
    }
    while (i < left.length) out.push(left[i++]);
    while (j < right.length) out.push(right[j++]);
    return out;
  }

  /**
   * Instrumented QuickSort over numbers — records a frame per comparison and
   * swap for the visualiser, and tallies comparison/swap/access counters.
   * Time: O(n log n) average  Space: O(n · frames)
   */
  static quickSortSteps(input: number[]): SortRun {
    const arr = [...input];
    const frames: SortFrame[] = [];
    const stats: SortStats = { comparisons: 0, swaps: 0, arrayAccesses: 0 };
    const sorted = new Set<number>();
    const snap = (comparing: number[], swapping: number[]): void => {
      frames.push({ array: [...arr], comparing, swapping, sorted: [...sorted] });
    };
    const swap = (i: number, j: number): void => {
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      stats.swaps++;
      stats.arrayAccesses += 4;
    };
    const quick = (lo: number, hi: number): void => {
      if (lo > hi) return;
      if (lo === hi) {
        sorted.add(lo);
        return;
      }
      const pivot = arr[hi];
      let i = lo;
      for (let j = lo; j < hi; j++) {
        stats.comparisons++;
        stats.arrayAccesses += 2;
        snap([j, hi], []);
        if (arr[j] <= pivot) {
          if (i !== j) {
            swap(i, j);
            snap([], [i, j]);
          }
          i++;
        }
      }
      if (i !== hi) {
        swap(i, hi);
        snap([], [i, hi]);
      }
      sorted.add(i);
      quick(lo, i - 1);
      quick(i + 1, hi);
    };
    quick(0, arr.length - 1);
    for (let k = 0; k < arr.length; k++) sorted.add(k);
    frames.push({ array: [...arr], comparing: [], swapping: [], sorted: [...sorted] });
    return { sorted: arr, stats, frames };
  }

  /**
   * Instrumented MergeSort over numbers — records a frame per comparison and
   * write-back for the visualiser.
   * Time: O(n log n) always  Space: O(n · frames)
   */
  static mergeSortSteps(input: number[]): SortRun {
    const arr = [...input];
    const frames: SortFrame[] = [];
    const stats: SortStats = { comparisons: 0, swaps: 0, arrayAccesses: 0 };
    const sorted = new Set<number>();
    const snap = (comparing: number[], swapping: number[]): void => {
      frames.push({ array: [...arr], comparing, swapping, sorted: [...sorted] });
    };
    const ms = (lo: number, hi: number): void => {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      ms(lo, mid);
      ms(mid + 1, hi);
      const temp: number[] = [];
      let i = lo;
      let j = mid + 1;
      while (i <= mid && j <= hi) {
        stats.comparisons++;
        stats.arrayAccesses += 2;
        snap([i, j], []);
        if (arr[i] <= arr[j]) temp.push(arr[i++]);
        else temp.push(arr[j++]);
      }
      while (i <= mid) temp.push(arr[i++]);
      while (j <= hi) temp.push(arr[j++]);
      for (let k = 0; k < temp.length; k++) {
        arr[lo + k] = temp[k];
        stats.swaps++;
        stats.arrayAccesses++;
        snap([], [lo + k]);
      }
    };
    ms(0, arr.length - 1);
    for (let k = 0; k < arr.length; k++) sorted.add(k);
    frames.push({ array: [...arr], comparing: [], swapping: [], sorted: [...sorted] });
    return { sorted: arr, stats, frames };
  }
}
