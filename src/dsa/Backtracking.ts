/**
 * Backtracking — recursive depth-first search that enumerates ALL simple paths
 * between two nodes while avoiding a set of blocked nodes.
 *
 * Used in SkyNet for: contingency rerouting. When a hub airport closes, this
 * finds every alternative route from origin to destination that does not pass
 * through the closed hub, so operations can pick a viable detour.
 *
 * The algorithm marks a node visited before recursing and un-marks it on the
 * way back out (the "backtrack" step) so a node can appear in other paths. It
 * also records the full exploration as a tree for the call-stack visualisation.
 *
 * Time complexity: O(V!) worst case (all permutations of a dense graph) —
 * exponential, which is why it is reserved for contingency planning, not
 * routine routing. Space complexity: O(V) recursion depth + O(paths) output.
 *
 * @example
 * const bt = new Backtracking(adjacency);
 * const { paths } = bt.findAllPaths('TAS', 'LHR', new Set(['IST']));
 */
export interface WeightedEdge<T> {
  to: T;
  weight: number;
}

export interface BTPath<T> {
  nodes: T[];
  cost: number;
}

export type BTStatus = 'root' | 'explore' | 'success' | 'deadend' | 'blocked' | 'visited';

export interface BTNode<T> {
  node: T;
  status: BTStatus;
  cost: number;
  children: BTNode<T>[];
}

export interface BTResult<T> {
  paths: BTPath<T>[];
  tree: BTNode<T>;
  explored: number;
}

export class Backtracking<T> {
  private adjacency: Map<T, WeightedEdge<T>[]>;

  constructor(adjacency: Map<T, WeightedEdge<T>[]>) {
    this.adjacency = adjacency;
  }

  /**
   * Enumerate simple paths from `start` to `end` avoiding `blocked` nodes.
   * Returns the paths (sorted cheapest-first), the recursion tree, and a count
   * of nodes explored.
   *
   * `options.maxDepth` caps the number of hops (legs) and `options.maxPaths`
   * caps how many routes are collected — both bound the otherwise exponential
   * search, which is appropriate for real rerouting (no airline wants a 12-leg
   * detour) and keeps the visualisation responsive.
   *
   * Time: O(V!) worst case, bounded by maxDepth/maxPaths  Space: O(V) recursion + O(output)
   */
  findAllPaths(
    start: T,
    end: T,
    blocked: Set<T> = new Set(),
    options: { maxDepth?: number; maxPaths?: number } = {},
  ): BTResult<T> {
    const maxDepth = options.maxDepth ?? Infinity;
    const maxPaths = options.maxPaths ?? Infinity;
    const paths: BTPath<T>[] = [];
    const visited = new Set<T>();
    let explored = 0;

    const tree: BTNode<T> = { node: start, status: 'root', cost: 0, children: [] };

    if (blocked.has(start) || blocked.has(end)) {
      tree.status = 'blocked';
      return { paths, tree, explored };
    }

    const dfs = (current: T, path: T[], costSoFar: number, treeNode: BTNode<T>, depth: number): void => {
      explored++;
      visited.add(current);

      if (current === end) {
        treeNode.status = 'success';
        paths.push({ nodes: [...path], cost: costSoFar });
        visited.delete(current);
        return;
      }

      if (depth >= maxDepth) {
        treeNode.status = 'deadend';
        visited.delete(current);
        return;
      }

      let advanced = false;
      for (const edge of this.adjacency.get(current) ?? []) {
        if (paths.length >= maxPaths) break;
        const nextCost = costSoFar + edge.weight;
        if (blocked.has(edge.to)) {
          treeNode.children.push({ node: edge.to, status: 'blocked', cost: nextCost, children: [] });
          continue;
        }
        if (visited.has(edge.to)) {
          treeNode.children.push({ node: edge.to, status: 'visited', cost: nextCost, children: [] });
          continue;
        }
        advanced = true;
        const childNode: BTNode<T> = { node: edge.to, status: 'explore', cost: nextCost, children: [] };
        treeNode.children.push(childNode);
        path.push(edge.to);
        dfs(edge.to, path, nextCost, childNode, depth + 1);
        path.pop(); // ← backtrack
      }

      if (!advanced) treeNode.status = 'deadend';
      visited.delete(current); // ← release node for other paths
    };

    dfs(start, [start], 0, tree, 0);
    paths.sort((a, b) => a.cost - b.cost);
    return { paths, tree, explored };
  }
}
