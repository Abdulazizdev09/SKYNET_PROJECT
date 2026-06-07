import { Graph } from '../dsa/Graph';
import type { WeightedEdge } from '../dsa/Backtracking';
import type { Airport } from '../types/airport';
import { haversineKm } from './geo';

/**
 * Build an undirected weighted Graph from airports and route pairs.
 * Edge weight = great-circle distance in km between the two airports.
 */
export function buildFlightGraph(airports: Airport[], pairs: [string, string][]): Graph<string> {
  const graph = new Graph<string>(false);
  const byIata = new Map<string, Airport>(airports.map((a): [string, Airport] => [a.iata, a]));
  for (const airport of airports) graph.addNode(airport.iata);
  for (const [from, to] of pairs) {
    const a = byIata.get(from);
    const b = byIata.get(to);
    if (!a || !b) continue;
    const distance = Math.round(haversineKm(a.lat, a.lng, b.lat, b.lng));
    graph.addEdge(from, to, distance);
  }
  return graph;
}

/** Convert a Graph into the adjacency Map the Backtracking explorer expects. */
export function graphToAdjacency(graph: Graph<string>): Map<string, WeightedEdge<string>[]> {
  const adjacency = new Map<string, WeightedEdge<string>[]>();
  for (const node of graph.getNodes()) {
    adjacency.set(
      node,
      graph.getNeighbors(node).map((edge) => ({ to: edge.to, weight: edge.weight })),
    );
  }
  return adjacency;
}

/** Estimated ticket cost (USD) for a route of a given total distance. */
export function routeCost(distanceKm: number): number {
  return Math.round(40 + distanceKm * 0.11);
}

/** Estimated flight time (minutes): cruise at ~800 km/h plus ground time. */
export function routeDuration(distanceKm: number): number {
  return Math.round(30 + (distanceKm / 800) * 60);
}
