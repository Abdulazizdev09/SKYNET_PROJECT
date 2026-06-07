/**
 * Graph — weighted graph backed by an adjacency list.
 *
 * Used in SkyNet for: modelling the global flight network. Airports are nodes
 * (keyed by IATA code) and direct flights are weighted edges (cost / distance /
 * time). Powers Dijkstra shortest-path routing and the Kruskal backup-network MST.
 *
 * Time complexity: O(1) amortised insertion, O(V + E) traversal.
 * Space complexity: O(V + E) for the adjacency list.
 *
 * @example
 * const g = new Graph<string>();
 * g.addEdge('TAS', 'IST', 380);
 * g.addEdge('IST', 'LHR', 410);
 * const { path, distance } = g.dijkstra('TAS', 'LHR'); // ['TAS','IST','LHR'], 790
 */
export interface GraphEdge<T> {
  from: T;
  to: T;
  weight: number;
}

export interface DijkstraResult<T> {
  path: T[];
  distance: number;
}

export interface MstResult<T> {
  edges: GraphEdge<T>[];
  totalWeight: number;
}

export class Graph<T> {
  private adjacency: Map<T, GraphEdge<T>[]>;
  private edgeList: GraphEdge<T>[];
  private directed: boolean;

  constructor(directed = false) {
    this.adjacency = new Map();
    this.edgeList = [];
    this.directed = directed;
  }

  /**
   * Insert a node. No-op if it already exists.
   * Time: O(1)  Space: O(1)
   */
  addNode(id: T): void {
    if (!this.adjacency.has(id)) this.adjacency.set(id, []);
  }

  /**
   * Insert a weighted edge (and its mirror when the graph is undirected).
   * Auto-creates either endpoint that is missing.
   * Time: O(1)  Space: O(1)
   */
  addEdge(from: T, to: T, weight: number): void {
    this.addNode(from);
    this.addNode(to);
    this.adjacency.get(from)!.push({ from, to, weight });
    this.edgeList.push({ from, to, weight });
    if (!this.directed) {
      this.adjacency.get(to)!.push({ from: to, to: from, weight });
    }
  }

  /** Time: O(1)  Space: O(1) */
  hasNode(id: T): boolean {
    return this.adjacency.has(id);
  }

  /** All node ids. Time: O(V)  Space: O(V) */
  getNodes(): T[] {
    return [...this.adjacency.keys()];
  }

  /** Outgoing edges of a node. Time: O(1)  Space: O(1) */
  getNeighbors(id: T): GraphEdge<T>[] {
    return this.adjacency.get(id) ?? [];
  }

  /** Canonical edge list (one entry per addEdge call). Time: O(E)  Space: O(E) */
  getEdges(): GraphEdge<T>[] {
    return [...this.edgeList];
  }

  /** Node count. Time: O(1)  Space: O(1) */
  get size(): number {
    return this.adjacency.size;
  }

  /**
   * Dijkstra's shortest path between two nodes.
   *
   * Uses a linear-scan min selection (no binary heap) for transparency, giving
   * O(V^2 + E). A binary-heap priority queue would lower this to O((V + E) log V)
   * — a classic time/space trade-off discussed in the report.
   *
   * Time: O(V^2 + E)  Space: O(V)
   */
  dijkstra(start: T, end: T): DijkstraResult<T> {
    if (!this.adjacency.has(start) || !this.adjacency.has(end)) {
      return { path: [], distance: Infinity };
    }
    const dist = new Map<T, number>();
    const prev = new Map<T, T | null>();
    const visited = new Set<T>();
    for (const node of this.adjacency.keys()) {
      dist.set(node, Infinity);
      prev.set(node, null);
    }
    dist.set(start, 0);

    while (visited.size < this.adjacency.size) {
      // Pick the unvisited node with the smallest tentative distance.
      let u: T | null = null;
      let best = Infinity;
      for (const [node, d] of dist) {
        if (!visited.has(node) && d < best) {
          best = d;
          u = node;
        }
      }
      if (u === null) break; // remaining nodes unreachable
      if (u === end) break; // shortest distance to target finalised
      visited.add(u);
      for (const edge of this.adjacency.get(u)!) {
        if (visited.has(edge.to)) continue;
        const candidate = dist.get(u)! + edge.weight;
        if (candidate < dist.get(edge.to)!) {
          dist.set(edge.to, candidate);
          prev.set(edge.to, u);
        }
      }
    }

    if (dist.get(end) === Infinity) return { path: [], distance: Infinity };
    const path: T[] = [];
    let cursor: T | null = end;
    while (cursor !== null) {
      path.unshift(cursor);
      cursor = prev.get(cursor) ?? null;
    }
    return { path, distance: dist.get(end)! };
  }

  /**
   * Kruskal's Minimum Spanning Tree via union-find (path-halving + union by rank).
   * Designs the lowest-cost backup network that still connects every airport.
   *
   * Time: O(E log E)  Space: O(V)
   */
  kruskal(): MstResult<T> {
    const parent = new Map<T, T>();
    const rank = new Map<T, number>();
    for (const node of this.adjacency.keys()) {
      parent.set(node, node);
      rank.set(node, 0);
    }
    const find = (x: T): T => {
      let root = x;
      while (parent.get(root)! !== root) {
        parent.set(root, parent.get(parent.get(root)!)!); // path halving
        root = parent.get(root)!;
      }
      return root;
    };
    const union = (a: T, b: T): boolean => {
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) return false;
      const rankA = rank.get(ra)!;
      const rankB = rank.get(rb)!;
      if (rankA < rankB) {
        parent.set(ra, rb);
      } else if (rankA > rankB) {
        parent.set(rb, ra);
      } else {
        parent.set(rb, ra);
        rank.set(ra, rankA + 1);
      }
      return true;
    };

    const sorted = [...this.edgeList].sort((a, b) => a.weight - b.weight);
    const mst: GraphEdge<T>[] = [];
    let totalWeight = 0;
    for (const edge of sorted) {
      if (union(edge.from, edge.to)) {
        mst.push(edge);
        totalWeight += edge.weight;
        if (mst.length === this.adjacency.size - 1) break;
      }
    }
    return { edges: mst, totalWeight };
  }
}
