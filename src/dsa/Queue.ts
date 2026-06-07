/**
 * Queue — First-In-First-Out (FIFO) queue.
 *
 * Used in SkyNet for: the physical boarding-gate line. Once a passenger is
 * pulled from the priority heap they join the back of this queue and board in
 * arrival order.
 *
 * Implementation note: a moving `head` index gives amortised O(1) dequeue
 * (compacting only when the dead prefix grows large) instead of the O(n) cost
 * of `Array.prototype.shift`.
 *
 * Time complexity: O(1) enqueue, amortised O(1) dequeue.
 * Space complexity: O(n).
 *
 * @example
 * const gate = new Queue<string>();
 * gate.enqueue('12A'); gate.enqueue('14C');
 * gate.dequeue(); // '12A'
 */
export class Queue<T> {
  private items: T[];
  private head: number;

  constructor() {
    this.items = [];
    this.head = 0;
  }

  /** Add to the back. Time: O(1)  Space: O(1) */
  enqueue(item: T): void {
    this.items.push(item);
  }

  /**
   * Remove and return the front element.
   * Time: amortised O(1)  Space: O(1)
   */
  dequeue(): T | undefined {
    if (this.head >= this.items.length) return undefined;
    const value = this.items[this.head];
    this.head++;
    // Reclaim memory once more than half the array is dead space.
    if (this.head > 16 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return value;
  }

  /** Front element without removing it. Time: O(1)  Space: O(1) */
  peek(): T | undefined {
    return this.head < this.items.length ? this.items[this.head] : undefined;
  }

  /** Time: O(1)  Space: O(1) */
  isEmpty(): boolean {
    return this.head >= this.items.length;
  }

  /** Live element count. Time: O(1)  Space: O(1) */
  get size(): number {
    return this.items.length - this.head;
  }

  /** Front-to-back snapshot for visualisation. Time: O(n)  Space: O(n) */
  toArray(): T[] {
    return this.items.slice(this.head);
  }
}
