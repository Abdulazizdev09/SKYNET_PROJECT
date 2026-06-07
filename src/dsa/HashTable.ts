/**
 * HashTable — hash map with separate chaining for collision resolution.
 *
 * Used in SkyNet for: mapping a Passenger Name Record (PNR) string to a
 * passenger profile, giving near-O(1) lookups during security checks. A
 * polynomial rolling hash spreads keys across buckets; collisions chain into a
 * per-bucket list. The table doubles when the load factor passes 0.75 to keep
 * chains short — the classic space-for-speed trade-off discussed in the report.
 *
 * Time complexity: O(1) average set / get / delete, O(n) worst case (all keys
 * collide). Space complexity: O(n + capacity).
 *
 * @example
 * const table = new HashTable<Passenger>();
 * table.set('SKY7Q2', passenger);
 * table.get('SKY7Q2'); // passenger  (O(1) average)
 */
export interface HashEntry<V> {
  key: string;
  value: V;
}

export interface HashProbe<V> {
  hash: number;
  index: number;
  bucket: HashEntry<V>[];
  found: V | null;
}

export class HashTable<V> {
  private buckets: HashEntry<V>[][];
  private capacity: number;
  private count: number;
  private readonly loadFactorLimit = 0.75;

  constructor(initialCapacity = 16) {
    this.capacity = initialCapacity;
    this.buckets = Array.from({ length: initialCapacity }, () => []);
    this.count = 0;
  }

  /**
   * Polynomial rolling hash (base 31), folded to an unsigned 32-bit integer.
   * Time: O(L) in key length  Space: O(1)
   */
  private hashCode(key: string): number {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = (Math.imul(h, 31) + key.charCodeAt(i)) | 0;
    }
    return h >>> 0;
  }

  /** Raw hash of a key (exposed for the lookup visualisation). Time: O(L)  Space: O(1) */
  hash(key: string): number {
    return this.hashCode(key);
  }

  private indexFor(key: string): number {
    return this.hashCode(key) % this.capacity;
  }

  /**
   * Insert or update a key/value pair.
   * Time: O(1) average  Space: O(1)
   */
  set(key: string, value: V): void {
    const idx = this.indexFor(key);
    const bucket = this.buckets[idx];
    for (const entry of bucket) {
      if (entry.key === key) {
        entry.value = value;
        return;
      }
    }
    bucket.push({ key, value });
    this.count++;
    if (this.count / this.capacity > this.loadFactorLimit) {
      this.resize(this.capacity * 2);
    }
  }

  /**
   * Look up a value by key.
   * Time: O(1) average  Space: O(1)
   */
  get(key: string): V | undefined {
    const bucket = this.buckets[this.indexFor(key)];
    for (const entry of bucket) {
      if (entry.key === key) return entry.value;
    }
    return undefined;
  }

  /** Time: O(1) average  Space: O(1) */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Remove a key. Returns true if it existed.
   * Time: O(1) average  Space: O(1)
   */
  delete(key: string): boolean {
    const bucket = this.buckets[this.indexFor(key)];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  /** Number of stored pairs. Time: O(1)  Space: O(1) */
  get size(): number {
    return this.count;
  }

  /** Current bucket-array length. Time: O(1)  Space: O(1) */
  getCapacity(): number {
    return this.capacity;
  }

  /** All stored keys. Time: O(n + capacity)  Space: O(n) */
  keys(): string[] {
    const out: string[] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) out.push(entry.key);
    }
    return out;
  }

  /** All stored values. Time: O(n + capacity)  Space: O(n) */
  values(): V[] {
    const out: V[] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) out.push(entry.value);
    }
    return out;
  }

  /** Read-only snapshot of every bucket for visualisation. Time: O(n + capacity)  Space: O(n) */
  getBuckets(): ReadonlyArray<ReadonlyArray<HashEntry<V>>> {
    return this.buckets.map((bucket) => [...bucket]);
  }

  /**
   * Trace the lookup of a key: its raw hash, bucket index, the bucket's
   * contents, and the resolved value. Drives the step-by-step UI animation.
   * Time: O(1) average  Space: O(1)
   */
  probe(key: string): HashProbe<V> {
    const hash = this.hashCode(key);
    const index = hash % this.capacity;
    const bucket = this.buckets[index];
    const entry = bucket.find((e) => e.key === key);
    return { hash, index, bucket: [...bucket], found: entry ? entry.value : null };
  }

  /**
   * Grow the table and rehash every entry into the new bucket array.
   * Time: O(n + capacity)  Space: O(n)
   */
  private resize(newCapacity: number): void {
    const old = this.buckets;
    this.capacity = newCapacity;
    this.buckets = Array.from({ length: newCapacity }, () => []);
    for (const bucket of old) {
      for (const entry of bucket) {
        this.buckets[this.hashCode(entry.key) % newCapacity].push(entry);
      }
    }
  }
}
