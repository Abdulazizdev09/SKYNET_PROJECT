/**
 * MaxHeap — binary max-heap priority queue stored in a flat array.
 *
 * Used in SkyNet for: the check-in priority queue. Passengers are ranked by
 * ticket class (First = 3, Business = 2, Economy = 1) so the highest-priority
 * traveller is always served next, regardless of arrival order.
 *
 * Time complexity: O(log n) insert / extract, O(1) peek.
 * Space complexity: O(n).
 *
 * @example
 * const heap = new MaxHeap<Passenger>((a, b) => a.priority - b.priority);
 * heap.insert(economyPax);
 * heap.insert(firstClassPax);
 * heap.extractMax(); // firstClassPax
 */
export class MaxHeap<T> {
  private items: T[];
  private compare: (a: T, b: T) => number;

  /**
   * @param compare returns > 0 when `a` outranks `b` (so `a` sits above `b`).
   */
  constructor(compare: (a: T, b: T) => number) {
    this.items = [];
    this.compare = compare;
  }

  /** Element count. Time: O(1)  Space: O(1) */
  get size(): number {
    return this.items.length;
  }

  /** Time: O(1)  Space: O(1) */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** Highest-priority element without removing it. Time: O(1)  Space: O(1) */
  peek(): T | undefined {
    return this.items[0];
  }

  /** Snapshot of the backing array (root-first) for visualisation. Time: O(n)  Space: O(n) */
  toArray(): T[] {
    return [...this.items];
  }

  /**
   * Insert an element and restore the heap property upward.
   * Time: O(log n)  Space: O(1)
   */
  insert(item: T): void {
    this.items.push(item);
    this.heapifyUp(this.items.length - 1);
  }

  /**
   * Remove and return the highest-priority element.
   * Time: O(log n)  Space: O(1)
   */
  extractMax(): T | undefined {
    if (this.items.length === 0) return undefined;
    const max = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.heapifyDown(0);
    }
    return max;
  }

  /**
   * Bubble the element at `index` up until its parent outranks it.
   * Time: O(log n)  Space: O(1)
   */
  private heapifyUp(index: number): void {
    let i = index;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.items[i], this.items[parent]) > 0) {
        this.swap(i, parent);
        i = parent;
      } else {
        break;
      }
    }
  }

  /**
   * Sink the element at `index` down until both children are outranked.
   * Time: O(log n)  Space: O(1)
   */
  private heapifyDown(index: number): void {
    const n = this.items.length;
    let i = index;
    while (true) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.compare(this.items[left], this.items[largest]) > 0) largest = left;
      if (right < n && this.compare(this.items[right], this.items[largest]) > 0) largest = right;
      if (largest === i) break;
      this.swap(i, largest);
      i = largest;
    }
  }

  /** Time: O(1)  Space: O(1) */
  private swap(a: number, b: number): void {
    const tmp = this.items[a];
    this.items[a] = this.items[b];
    this.items[b] = tmp;
  }
}
