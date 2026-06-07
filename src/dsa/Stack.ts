/**
 * Stack — Last-In-First-Out (LIFO) stack.
 *
 * Used in SkyNet for: the aircraft cargo hold. Luggage loaded last sits on top
 * and is the first unloaded — exactly the LIFO discipline. Also the canonical
 * model for the call stack behind recursive function calls.
 *
 * Time complexity: O(1) push / pop / peek.
 * Space complexity: O(n).
 *
 * @example
 * const hold = new Stack<string>();
 * hold.push('BAG-1'); hold.push('BAG-2');
 * hold.pop(); // 'BAG-2'
 */
export class Stack<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  /** Push onto the top. Time: O(1)  Space: O(1) */
  push(item: T): void {
    this.items.push(item);
  }

  /** Pop the top element. Time: O(1)  Space: O(1) */
  pop(): T | undefined {
    return this.items.pop();
  }

  /** Top element without removing it. Time: O(1)  Space: O(1) */
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /** Time: O(1)  Space: O(1) */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** Time: O(1)  Space: O(1) */
  get size(): number {
    return this.items.length;
  }

  /** Bottom-to-top snapshot for visualisation. Time: O(n)  Space: O(n) */
  toArray(): T[] {
    return [...this.items];
  }
}
