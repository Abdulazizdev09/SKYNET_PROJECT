/**
 * AVLTree — self-balancing binary search tree (Adelson-Velsky & Landis).
 *
 * Used in SkyNet for: storing flight prices so that range queries
 * ("show flights between $200 and $500") run in O(log n + k) instead of a
 * linear scan. Every insert/delete rebalances via rotations so the height stays
 * Θ(log n), guaranteeing logarithmic search regardless of insertion order.
 *
 * Keys are numeric (the price). Multiple flights may share a price, so each node
 * holds an array of values.
 *
 * Time complexity: O(log n) insert / delete / search.
 * Space complexity: O(n).
 *
 * @example
 * const tree = new AVLTree<Flight>(f => f.price);
 * tree.insert(flightA); // price 250
 * tree.insert(flightB); // price 480
 * tree.rangeQuery(200, 500); // [flightA, flightB]
 */
interface AVLNode<T> {
  key: number;
  values: T[];
  height: number;
  left: AVLNode<T> | null;
  right: AVLNode<T> | null;
}

export interface AVLVizNode<T> {
  key: number;
  height: number;
  balance: number;
  values: T[];
  left: AVLVizNode<T> | null;
  right: AVLVizNode<T> | null;
}

export class AVLTree<T> {
  private root: AVLNode<T> | null = null;
  private getKey: (item: T) => number;
  private count = 0;

  constructor(getKey: (item: T) => number) {
    this.getKey = getKey;
  }

  /** Total values stored. Time: O(1)  Space: O(1) */
  get size(): number {
    return this.count;
  }

  /** Time: O(1)  Space: O(1) */
  isEmpty(): boolean {
    return this.root === null;
  }

  /** Height of the whole tree. Time: O(1)  Space: O(1) */
  height(): number {
    return this.nodeHeight(this.root);
  }

  /**
   * Insert an item under its numeric key, rebalancing on the way up.
   * Time: O(log n)  Space: O(log n) recursion
   */
  insert(item: T): void {
    const key = this.getKey(item);
    this.root = this.insertNode(this.root, key, item);
  }

  /**
   * Remove the node for a key (and all values stored at it).
   * Returns true if a node was removed.
   * Time: O(log n)  Space: O(log n) recursion
   */
  delete(key: number): boolean {
    const node = this.findNode(this.root, key);
    if (!node) return false;
    this.count -= node.values.length;
    this.root = this.deleteNode(this.root, key);
    return true;
  }

  /**
   * Return all values stored at an exact key (empty if none).
   * Time: O(log n)  Space: O(1)
   */
  search(key: number): T[] {
    const node = this.findNode(this.root, key);
    return node ? [...node.values] : [];
  }

  /**
   * Return every value whose key lies within [min, max], inorder (ascending).
   * Prunes whole subtrees that fall outside the range.
   * Time: O(log n + k)  Space: O(k)
   */
  rangeQuery(min: number, max: number): T[] {
    const out: T[] = [];
    const walk = (node: AVLNode<T> | null): void => {
      if (!node) return;
      if (node.key > min) walk(node.left);
      if (node.key >= min && node.key <= max) out.push(...node.values);
      if (node.key < max) walk(node.right);
    };
    walk(this.root);
    return out;
  }

  /**
   * Balance factor (left height − right height) of the node for a key.
   * Returns null if the key is absent. |bf| ≤ 1 holds for every AVL node.
   * Time: O(log n)  Space: O(1)
   */
  getBalanceFactor(key: number): number | null {
    const node = this.findNode(this.root, key);
    return node ? this.balance(node) : null;
  }

  /** Ascending list of all values. Time: O(n)  Space: O(n) */
  inorder(): T[] {
    const out: T[] = [];
    const walk = (node: AVLNode<T> | null): void => {
      if (!node) return;
      walk(node.left);
      out.push(...node.values);
      walk(node.right);
    };
    walk(this.root);
    return out;
  }

  /** Serialise the tree (with per-node balance factors) for SVG visualisation. Time: O(n)  Space: O(n) */
  toViz(): AVLVizNode<T> | null {
    const build = (node: AVLNode<T> | null): AVLVizNode<T> | null => {
      if (!node) return null;
      return {
        key: node.key,
        height: node.height,
        balance: this.balance(node),
        values: [...node.values],
        left: build(node.left),
        right: build(node.right),
      };
    };
    return build(this.root);
  }

  // ── internal mechanics ───────────────────────────────────────────────

  /** Height of a node (0 for null). Time: O(1)  Space: O(1) */
  private nodeHeight(node: AVLNode<T> | null): number {
    return node ? node.height : 0;
  }

  /** Balance factor of a node. Time: O(1)  Space: O(1) */
  private balance(node: AVLNode<T>): number {
    return this.nodeHeight(node.left) - this.nodeHeight(node.right);
  }

  /** Recompute a node's cached height. Time: O(1)  Space: O(1) */
  private updateHeight(node: AVLNode<T>): void {
    node.height = 1 + Math.max(this.nodeHeight(node.left), this.nodeHeight(node.right));
  }

  /**
   * Left rotation around `x` (right child becomes the new subtree root).
   * Time: O(1)  Space: O(1)
   */
  private rotateLeft(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    x.right = y.left;
    y.left = x;
    this.updateHeight(x);
    this.updateHeight(y);
    return y;
  }

  /**
   * Right rotation around `y` (left child becomes the new subtree root).
   * Time: O(1)  Space: O(1)
   */
  private rotateRight(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    y.left = x.right;
    x.right = y;
    this.updateHeight(y);
    this.updateHeight(x);
    return x;
  }

  /**
   * Rebalance a node after insert/delete using the four AVL rotation cases.
   * Time: O(1)  Space: O(1)
   */
  private rebalance(node: AVLNode<T>): AVLNode<T> {
    this.updateHeight(node);
    const bf = this.balance(node);
    // Left heavy
    if (bf > 1) {
      if (this.balance(node.left!) < 0) node.left = this.rotateLeft(node.left!); // Left-Right
      return this.rotateRight(node); // Left-Left
    }
    // Right heavy
    if (bf < -1) {
      if (this.balance(node.right!) > 0) node.right = this.rotateRight(node.right!); // Right-Left
      return this.rotateLeft(node); // Right-Right
    }
    return node;
  }

  private insertNode(node: AVLNode<T> | null, key: number, item: T): AVLNode<T> {
    if (!node) {
      this.count++;
      return { key, values: [item], height: 1, left: null, right: null };
    }
    if (key < node.key) {
      node.left = this.insertNode(node.left, key, item);
    } else if (key > node.key) {
      node.right = this.insertNode(node.right, key, item);
    } else {
      node.values.push(item); // duplicate price — no structural change
      this.count++;
      return node;
    }
    return this.rebalance(node);
  }

  private deleteNode(node: AVLNode<T> | null, key: number): AVLNode<T> | null {
    if (!node) return null;
    if (key < node.key) {
      node.left = this.deleteNode(node.left, key);
    } else if (key > node.key) {
      node.right = this.deleteNode(node.right, key);
    } else if (node.left && node.right) {
      // Two children: copy inorder successor up, then remove it from the right subtree.
      let succ = node.right;
      while (succ.left) succ = succ.left;
      node.key = succ.key;
      node.values = succ.values;
      node.right = this.deleteNode(node.right, succ.key);
    } else {
      return node.left ?? node.right;
    }
    return this.rebalance(node);
  }

  private findNode(node: AVLNode<T> | null, key: number): AVLNode<T> | null {
    let current = node;
    while (current) {
      if (key < current.key) current = current.left;
      else if (key > current.key) current = current.right;
      else return current;
    }
    return null;
  }
}
