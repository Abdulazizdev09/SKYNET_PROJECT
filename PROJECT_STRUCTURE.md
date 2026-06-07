# SkyNet — Project Structure & Architecture

> Global Aviation Logistics & Management System — BTEC Unit 26 (Data Structures & Algorithms).
> This document maps the whole codebase: every file, every DSA class, the API layer, the
> component tree, data flow, environment, performance decisions, and the assignment-criteria
> evidence trail.

---

## 1. Overview

SkyNet is a single-page React + TypeScript dashboard that demonstrates classic data structures
and algorithms applied to a realistic aviation-operations domain. It has five functional areas —
a live **Flight Network** map, passenger **Check-in & Boarding**, **Search & Retrieval**,
**Analytics & Sorting**, and contingency **Rerouting**. Every algorithm (Dijkstra, Kruskal,
heaps, AVL trees, hashing, QuickSort/MergeSort, KMP, recursive backtracking) is hand-implemented
in `src/dsa/` with no external algorithm libraries. Live data comes from two public APIs —
**OpenSky Network** (live aircraft positions) and **AirLabs** (airports, schedules, live
flights) — with a fully functional offline fallback (a built-in 50-airport network and a
simulated fleet) so the app works even when the APIs are blocked by CORS or rate limits.

---

## 2. Tech Stack

| Category | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | ^19.2.6 | UI rendering, hooks-based state |
| Language | TypeScript | ~6.0.2 | Strict static typing (`strict: true`, no `any`) |
| Build tool | Vite | ^8.0.12 | Dev server + production bundler |
| React plugin | @vitejs/plugin-react | ^6.0.1 | Fast refresh + JSX transform |
| Styling | Tailwind CSS | ^3.4.19 | Utility-first design system (Aviasales light theme) |
| CSS pipeline | PostCSS + Autoprefixer | ^8.5 / ^10.5 | Tailwind processing + vendor prefixes |
| HTTP | Axios | ^1.17.0 | Typed API requests with timeouts |
| Map | Leaflet | ^1.9.4 | Interactive slippy map |
| Map (React) | react-leaflet | ^5.0.0 | React bindings for Leaflet (v5 = React 19 compatible) |
| Map clustering | leaflet.markercluster | ^1.5.3 | Airport marker clustering/culling |
| Charts | Recharts | ^3.8.1 | (available; analytics uses custom animated SVG/bars) |
| Icons | lucide-react | ^1.17.0 | Icon set throughout the UI |
| Types | @types/leaflet, @types/leaflet.markercluster, @types/react(-dom), @types/node | — | Type declarations |
| Lint | eslint + typescript-eslint | ^10 / ^8.59 | Linting |

> Note on Recharts: the spec lists Recharts for the analytics bar chart, but the sorting
> visualiser needs **per-frame** colour/position control to animate comparisons and swaps,
> which a declarative Recharts `BarChart` cannot express cleanly. The race uses a custom
> flex/SVG bar renderer instead; Recharts remains available for static charts.

---

## 3. Full File Tree

```
skynet/
├── index.html                      # HTML shell, Inter font preconnect, #root
├── vite.config.ts                  # Vite + React plugin
├── tailwind.config.js              # Design tokens (colors, shadows, keyframes)
├── postcss.config.js               # Tailwind + autoprefixer
├── tsconfig.app.json               # strict TS config for src/
├── .env                            # VITE_* API keys (not committed in real use)
├── PROJECT_STRUCTURE.md            # this document
└── src/
    ├── main.tsx                    # React entry; imports Leaflet + markercluster + index.css
    ├── App.tsx                     # App shell: sidebar nav, top-bar status, routing, clock
    ├── index.css                   # Tailwind layers + global styles + map/marker CSS + keyframes
    │
    ├── dsa/                        # ── Pure TypeScript data structures & algorithms ──
    │   ├── Graph.ts                # Adjacency-list graph; Dijkstra shortest path; Kruskal MST
    │   ├── Heap.ts                 # MaxHeap priority queue (insert/extractMax O(log n))
    │   ├── Queue.ts                # FIFO queue with amortised O(1) dequeue (head index)
    │   ├── Stack.ts                # LIFO stack (push/pop/peek O(1))
    │   ├── AVLTree.ts              # Self-balancing BST; insert/delete/search/rangeQuery O(log n)
    │   ├── HashTable.ts            # Separate-chaining hash map; resize at 0.75 load factor
    │   ├── Sorting.ts              # QuickSort + MergeSort (+ instrumented step-recording variants)
    │   ├── KMP.ts                  # Knuth–Morris–Pratt string search (+ failure table, stats)
    │   └── Backtracking.ts         # Recursive all-paths search avoiding blocked nodes
    │
    ├── api/                        # ── External API service layer ──
    │   ├── airlabs.ts              # Airports (per-country), live /flights (bbox+zoom), schedules, ping
    │   └── opensky.ts              # OAuth token, live states (bbox), sim-fleet generators, ping
    │
    ├── types/                      # ── Shared TypeScript interfaces ──
    │   ├── airport.ts              # AirLabsAirport (raw) + Airport (normalised)
    │   ├── flight.ts               # OpenSky tuple/state, AirLabsFlight, AirLabsSchedule, Flight, RouteResult
    │   └── passenger.ts            # Seat, Passenger, LuggageItem, SeatClass, CLASS_PRIORITY
    │
    ├── hooks/                      # ── Custom React hooks (all data fetching lives here) ──
    │   ├── useAirports.ts          # {data,loading,error,retry} global airports (legacy/other views)
    │   ├── useSchedules.ts         # {data,loading,error,retry} flight schedules
    │   ├── useViewportAircraft.ts  # Viewport-scoped aircraft (bbox+zoom, visibility-paused, cap 300)
    │   ├── useApiStatus.ts         # OpenSky + AirLabs connectivity probes (30s)
    │   └── useClock.ts             # Ticking Date for the sidebar UTC clock
    │
    ├── data/                       # ── Static + generated datasets ──
    │   ├── airports.ts             # FALLBACK_AIRPORTS: 50 real major hubs (offline backbone)
    │   ├── routes.ts               # ROUTE_PAIRS: ~110 real routes between the hubs (graph edges)
    │   ├── continents.ts           # Continent→country-code map, bounds, names (map filter)
    │   ├── flights.ts              # generateFlights(): seeded synthetic flights w/ prices/times
    │   ├── cabin.ts                # A320 seat-map builder + pre-booked passenger seeding
    │   ├── passengers.ts           # generatePassengers(): PNR directory for hash lookup
    │   └── names.ts                # Name pools + generateManifest() for KMP demo
    │
    ├── utils/                      # ── Pure helpers ──
    │   ├── geo.ts                  # haversineKm, duration/time formatters, number formatting
    │   ├── network.ts              # buildFlightGraph, graphToAdjacency, routeCost, routeDuration
    │   └── random.ts               # mulberry32 seeded PRNG + pick/randInt
    │
    └── components/                 # ── React UI ──
        ├── ui/                     # Reusable primitives
        │   ├── Button.tsx          #   primary/secondary/ghost/danger button
        │   ├── Card.tsx            #   white rounded card w/ shadow (+ hover)
        │   ├── Badge.tsx           #   pill badge (6 tones)
        │   ├── StatusBadge.tsx     #   flight-status → coloured badge
        │   ├── Skeleton.tsx        #   shimmering loading placeholder
        │   ├── Input.tsx           #   labelled input w/ optional icon
        │   └── Select.tsx          #   labelled select
        ├── FlightNetwork/          # Phase 1 — map
        │   ├── FlightNetwork.tsx   #   container: filter+routing+layers (React.memo)
        │   ├── ContinentFilter.tsx #   continent pills + country dropdown + show-all toggle
        │   ├── AirportLayer.tsx    #   imperative markercluster airport layer
        │   ├── AircraftLayer.tsx   #   imperative aircraft layer (setLatLng, no re-render)
        │   └── MapEvents.tsx       #   debounced moveend/zoomend → viewport callback
        ├── CheckIn/                # Phase 2 — boarding
        │   ├── CheckIn.tsx         #   seat map + booking modal + DSA orchestration
        │   ├── BoardingQueue.tsx   #   MaxHeap SVG tree + FIFO gate queue
        │   └── CargoHold.tsx       #   LIFO luggage stack
        ├── Search/                 # Phase 3 — search
        │   ├── Search.tsx          #   AVL price filter + results + PNR panel
        │   ├── AvlTreeView.tsx     #   SVG AVL tree w/ balance factors + range highlight
        │   └── PnrLookup.tsx       #   hash-table PNR lookup w/ step trace
        ├── Analytics/              # Phase 4 — analytics
        │   ├── Analytics.tsx       #   container (schedule data → race + KMP)
        │   ├── SortRace.tsx        #   QuickSort vs MergeSort animated race + metrics
        │   └── KmpSearch.tsx       #   KMP manifest search + LPS table + highlights
        └── Rerouting/              # Phase 5 — rerouting
            ├── Rerouting.tsx       #   backtracking explorer (origin/dest/closed-hub)
            ├── BacktrackTree.tsx   #   live-building recursion call-tree SVG
            └── RerouteMap.tsx      #   mini-map of discovered alternative paths
```

---

## 4. DSA Classes Reference

| Class | File | Key methods (Big-O) | Used by | How |
|---|---|---|---|---|
| `Graph<T>` | `dsa/Graph.ts` | `addEdge` O(1); `dijkstra` O(V²+E); `kruskal` O(E log E) | FlightNetwork, Rerouting | Airports = nodes, routes = weighted edges; Dijkstra = shortest route, Kruskal = backup network (MST) |
| `MaxHeap<T>` | `dsa/Heap.ts` | `insert`/`extractMax` O(log n); `peek` O(1) | CheckIn (BoardingQueue) | Passengers ranked by class priority; root = next to board |
| `Queue<T>` | `dsa/Queue.ts` | `enqueue` O(1); `dequeue` amortised O(1) | CheckIn (gate) | FIFO boarding-gate line |
| `Stack<T>` | `dsa/Stack.ts` | `push`/`pop`/`peek` O(1) | CheckIn (CargoHold) | LIFO cargo loading/unloading |
| `AVLTree<T>` | `dsa/AVLTree.ts` | `insert`/`delete`/`search` O(log n); `rangeQuery` O(log n + k); rotations O(1) | Search (AvlTreeView) | Flight prices indexed by price; range queries highlight matches |
| `HashTable<V>` | `dsa/HashTable.ts` | `set`/`get`/`delete` avg O(1); `resize` O(n) | CheckIn, Search (PnrLookup) | PNR → passenger profile; chaining + load-factor resize |
| `Sorting` | `dsa/Sorting.ts` | `quickSort` O(n log n) avg; `mergeSort` O(n log n) | Analytics (SortRace) | Race sorts schedule departure times; instrumented variants record frames |
| `KMP` | `dsa/KMP.ts` | `buildFailureTable` O(m); `search` O(n+m) | Analytics (KmpSearch) | Name pattern matching in a 500-row manifest |
| `Backtracking<T>` | `dsa/Backtracking.ts` | `findAllPaths` O(V!) bounded by maxDepth/maxPaths | Rerouting | All alternative routes avoiding a closed hub + recursion tree |

Every class: pure TypeScript, generics where type-agnostic, JSDoc with `Time:`/`Space:` on every
method, `private` internal state, named export, filename = class name.

---

## 5. API Layer Reference

### `api/airlabs.ts` — wraps AirLabs (`https://airlabs.co/api/v9`)

| Export | Params | Returns | Notes |
|---|---|---|---|
| `fetchAirportsByCountry(countryCode)` | ISO-2 code | `Promise<Airport[]>` | `_fields` trimmed payload + `is_major`; falls back to dataset slice |
| `fetchAirports()` | — | `Promise<Airport[]>` | Legacy global fetch; **not used by the map** (kept for other views) |
| `fetchAirLabsFlights(bbox, zoom)` | "S,W,N,E", 0–11 | `Promise<OpenSkyState[]>` | Viewport live flights; **throws** so caller can fall back |
| `fetchSchedules(depIata?)` | IATA | `Promise<Flight[]>` | Attempts API, returns seeded synthetic schedule (carries prices) |
| `pingAirlabs()` | — | `Promise<boolean>` | Status indicator |
| `HAS_AIRLABS_KEY` | — | `boolean` | Whether a key is configured |

### `api/opensky.ts` — wraps OpenSky (`https://opensky-network.org/api`)

| Export | Params | Returns | Notes |
|---|---|---|---|
| `fetchLiveAircraft(bbox)` | `BBox` | `Promise<OpenSkyState[]>` | **bbox mandatory** (never global); OAuth Bearer if token obtained |
| `zoomDensityParam(zoom)` | number | number | Map zoom → AirLabs `zoom` density (3/6/9) |
| `densityForZoom(zoom)` | number | number | Map zoom → simulated fleet size (60/180/300) |
| `capAircraft(list, max)` | list, 300 | `OpenSkyState[]` | Hard cap, keeps fastest aircraft |
| `generateSimulatedAircraftInBbox(bbox, n)` | — | `OpenSkyState[]` | Offline fleet inside viewport |
| `advanceAircraft(states, secs, bbox)` | — | `OpenSkyState[]` | Moves sim fleet along heading (pure) |
| `pingOpenSky()` | — | `Promise<boolean>` | Status indicator (tiny bbox) |

**Caching / rate-limit strategy.** Airports are cached per country in a `useRef<Map>` inside
`FlightNetwork` — a country is never re-fetched in a session. The OpenSky OAuth token is cached
in-module until ~60s before expiry. Live flights are fetched **only on map move/zoom** (debounced
800ms) — there is no fixed polling timer — and the OpenSky/AirLabs `zoom`/`bbox` parameters cap
result density server-side. All calls have timeouts and `try/catch` with graceful fallback.

---

## 6. Component Hierarchy

```
App  (sidebar + top-bar + page router, ticking clock, fleet counter)
├── Sidebar (nav, UTC clock, "aircraft in view" counter)
├── TopBar  (page title, OpenSky + AirLabs status dots)
└── <active page>
    ├── FlightNetwork                         (React.memo)
    │   ├── MapContainer (Leaflet)
    │   │   ├── TileLayer (OSM, desaturated)
    │   │   ├── Polyline ×N      (Kruskal MST overlay)
    │   │   ├── Polyline + CircleMarker + RoutePlane   (Dijkstra route)
    │   │   ├── AirportLayer     (markercluster, imperative)
    │   │   ├── AircraftLayer    (imperative setLatLng)
    │   │   ├── MapEvents        (debounced viewport reporter)
    │   │   └── FlyTo / FitRoute (camera controllers)
    │   ├── ContinentFilter      (overlay: pills + country + show-all)
    │   ├── RoutePlanner card    (overlay)
    │   ├── LiveStatus card      (overlay)
    │   └── SelectedAirport card (overlay)
    ├── CheckIn
    │   ├── StatCards
    │   ├── SeatMap (cabin) + BookingModal + PassengerInfo modal
    │   ├── BoardingQueue (HeapTree SVG + FIFO gate)
    │   └── CargoHold (LIFO stack)
    ├── Search
    │   ├── Filters + AvlTreeView + Results
    │   └── PnrLookup
    ├── Analytics
    │   ├── SortRace (QuickSort | MergeSort panels)
    │   └── KmpSearch (LPS table + highlighted manifest)
    └── Rerouting
        ├── Controls (origin/dest/closed-hub)
        ├── RerouteMap (discovered paths) + Results
        └── BacktrackTree (recursion call tree)
```

---

## 7. Data Flow

General rule: **API → hook → component → DSA → UI**. Fetching only happens inside `src/hooks/`
and `src/api/`; components never fetch in JSX.

- **Flight Network (live aircraft):**
  `MapEvents` (moveend/zoomend, debounced) → `useViewportAircraft.setViewport(bbox, zoom)` →
  `fetchAirLabsFlights` → (fail) `fetchLiveAircraft` → (fail) `generateSimulatedAircraftInBbox` →
  `capAircraft(300)` → `AircraftLayer` updates markers imperatively via `setLatLng`.
- **Flight Network (airports):**
  `ContinentFilter` selection → `FlightNetwork.loadAirports` → `fetchAirportsByCountry` per country
  (`Promise.all`, cached) → filter by `is_major`/`showAll` → `AirportLayer` (markercluster).
- **Flight Network (routing):**
  airport click → `Graph.dijkstra` (curated graph) → route polyline + `routeCost`/`routeDuration`
  → RoutePlanner card; "Show MST" → `Graph.kruskal` → grey overlay.
- **Check-in:** seat click → BookingModal → `HashTable.set` (PNR) + `MaxHeap.insert` (priority) →
  "Call Next" → `MaxHeap.extractMax` → `Queue.enqueue` → "Board" → `Queue.dequeue`; luggage →
  `Stack.push/pop`.
- **Search:** filters → `AVLTree` built from synthetic flights → `rangeQuery(min,max)` → results +
  `AvlTreeView`; PNR input → `HashTable.probe` → step trace + profile.
- **Analytics:** `useSchedules` → departure minutes → `Sorting.quickSortSteps`/`mergeSortSteps`
  (frames) → animated bars + counters; pattern → `KMP.searchWithStats` → highlights + LPS table.
- **Rerouting:** origin/dest/closed-hub → `Backtracking.findAllPaths(blocked, {maxDepth, maxPaths})`
  → paths revealed on `RerouteMap` + `BacktrackTree`.

---

## 8. Environment Variables

| Variable | Purpose | Where to get it |
|---|---|---|
| `VITE_AIRLABS_KEY` | AirLabs API key (airports, flights, schedules) | https://airlabs.co (free tier) |
| `VITE_OPENSKY_CLIENT_ID` | OpenSky OAuth2 client id | https://opensky-network.org account → API client |
| `VITE_OPENSKY_CLIENT_SECRET` | OpenSky OAuth2 client secret | same as above |

All are read via `import.meta.env.VITE_*` — never hard-coded. If any are missing or the calls
fail (CORS/rate limit), the app uses its offline fallback and still works end-to-end.

---

## 9. Performance Decisions

| Problem | Fix | Why |
|---|---|---|
| Global airport fetch/render froze the map | Continent → per-country fetch with `_fields` + `is_major`, `Promise.all`, per-country `useRef` cache | Loads only what's in view; trims payload; never re-fetches a country |
| Global `/states/all` returned thousands of aircraft | **bbox is mandatory** + AirLabs `zoom` density param | Server returns only viewport-relevant, density-appropriate aircraft |
| Fetching on a fixed timer wasted requests | Fetch only on `moveend`/`zoomend`, debounced 800ms | No work while idle or mid-drag |
| Same density at every zoom | `zoomDensityParam` (3/6/9) + `densityForZoom` (60/180/300) | Sparse when zoomed out, detailed when zoomed in |
| Re-rendering every marker each tick | `AircraftLayer` updates markers imperatively (`setLatLng`/`setIcon`), keyed by icao24 | React never reconciles markers; smooth animation |
| Thousands of airport markers | `leaflet.markercluster` (chunked loading, cluster badges) | Off-screen/low-zoom airports collapse into counts |
| Unbounded marker count | Hard cap of **300** aircraft (`capAircraft`, fastest first) | Predictable upper bound on DOM work |
| Work continued on hidden tabs | `visibilitychange` pauses sim animation + fetch | No CPU/network when tab not visible |
| Re-computation on every render | `React.memo` on FlightNetwork; `useMemo` for graph/filtered airports/route; `useCallback` for handlers | Avoids redundant graph builds and re-renders |
| Backtracking is exponential | `maxDepth`/`maxPaths` caps on `findAllPaths` | Keeps contingency search responsive |

> Library choice: `leaflet.markercluster` is used directly rather than `react-leaflet-cluster`,
> because the latter targets react-leaflet v4 and breaks against this project's react-leaflet v5
> (React 19) due to a `@react-leaflet/core` context mismatch.

---

## 10. Assignment Criteria Mapping

| Criterion | DSA / Module | Component | Evidence |
|---|---|---|---|
| **P1** Design spec for data structures | all `dsa/*` | — | JSDoc valid-operations + `types/*` interfaces |
| **P2** Memory stack & function calls | `Stack.ts` | CheckIn / CargoHold | `push`/`pop`/`peek`; backtracking recursion mirrors the call stack |
| **P3** ADT for a stack (imperative) | `Stack.ts` | — | Encapsulated `private items`, imperative method contract |
| **P4** Implement complex ADT + algorithm | `Graph.ts`, `AVLTree.ts`, `Backtracking.ts` | FlightNetwork, Search, Rerouting | Dijkstra/Kruskal, AVL balancing, all-paths search |
| **P5** Error handling + test results | `api/*`, hooks | all (loading/error states) | `try/catch` + fallbacks; loading skeletons; retry buttons |
| **P6** Asymptotic analysis | all `dsa/*` | — | `Time:`/`Space:` Big-O JSDoc on every method |
| **P7** Two efficiency measures | `Sorting.ts` | Analytics / SortRace | Comparison/swap counters **and** `performance.now()` timing |
| **M1** Concrete FIFO queue example | `Queue.ts` | CheckIn gate | Head-index FIFO with live visualisation |
| **M2** Compare two sorting algorithms | `Sorting.ts` | SortRace | QuickSort vs MergeSort, counters + winner |
| **M3** Encapsulation / information hiding | all `dsa/*` | — | `private` state; UI uses public methods only |
| **M4** ADT/algorithm solves a problem | `Graph.ts`, `Backtracking.ts` | FlightNetwork, Rerouting | Shortest route + hub-closure rerouting |
| **M5** Trade-off when specifying an ADT | `HashTable.ts`, `Graph.ts` | Search | Hash speed vs memory (resize); Dijkstra array vs heap note |
| **D1** Two shortest-path algorithms | `Graph.ts` | FlightNetwork | Dijkstra (route) + Kruskal MST overlay, illustrated on the map |
| **D2** Imperative ADTs → OOP | `dsa/*` classes | — | Class-based encapsulated ADTs |
| **D3** Critically evaluate complexity | `AVLTree.ts`, `HashTable.ts` | Search | Balanced O(log n) vs average O(1) with worst-case notes |
| **D4** Benefits of implementation-independent structures | generics across `dsa/*` | all | One `Graph<T>`/`AVLTree<T>` reused for different value types |

---

## 11. OpenFlights Merge — Datasets, Sources, Logbook

SkyNet now incorporates the OpenFlights open datasets and its personal-logbook concept, on
top of the original DSA dashboard.

### Switchable data sources (top-bar pill → Data Sources page)
A `DataSourceProvider` (React context, persisted to `localStorage`) holds two independent choices:

| Axis | Options | Controls |
|---|---|---|
| **Static** | `openflights` (full ODbL datasets fetched from GitHub raw, IndexedDB-cached), `airlabs`, `local` (offline 50-hub pack) | Airlines, Aircraft, Logbook airport resolution, Trip Stats |
| **Live** | `opensky`, `airlabs`, `simulated` (local) | Flight Network live aircraft |

The **Data Sources** page lets you switch either axis, see which datasets are cached, clear the
cache, and — with one click — **Use Local Data** (`resetToLocal` → static=local, live=simulated)
for a fully offline session. GitHub raw is CORS-open (`access-control-allow-origin: *`), so the
~7,700-airport / ~5,900-airline / ~67,000-route datasets fetch directly in the browser with no proxy.

### New datasets (OpenFlights, ODbL 1.0 — attribution required)
`airports.dat`, `airlines.dat`, `routes.dat`, `planes.dat`, `countries.dat` — parsed by a
hand-written CSV reader, cached in IndexedDB, and degraded to the local pack on any failure.
Source & licence: <https://openflights.org/data> (Open Database License 1.0).

### New feature pages (all reinforce DSA)
- **Logbook** (`components/Logbook/Logbook.tsx`) — log flights you've flown (from/to/date/airline/
  aircraft/class/reason/mode), filter by year/class/reason/search, import/export JSON + CSV,
  persisted in `localStorage` via `useLogbook`. Sub-tabs: Log · Map · Stats.
- **My-Flights Map** (`Logbook/MyFlightsMap.tsx`) — great-circle arcs of logged routes + visited
  airports, OpenFlights-style.
- **Trip Stats** (`Logbook/TripStats.tsx`) — distance/hours/airports/countries, top airlines &
  airports ranked via **MaxHeap** over **HashTable** counts, Recharts bar + pie charts.
- **Airline Directory** (`Airlines/AirlineDirectory.tsx`) — search 5,900 airlines via **KMP**
  name matching + **HashTable** O(1) code lookup.
- **Aircraft Directory** (`Aircraft/AircraftDirectory.tsx`) — planes.dat browser with KMP search.
- **Data Sources** (`Settings/DataSourceManager.tsx`) — the source switcher + cache manager.

### New files
```
src/types/      airline.ts, aircraft.ts, route.ts (Country), logbook.ts, source.ts
src/utils/      csv.ts (.dat parser), idb.ts (IndexedDB cache); geo.ts gains greatCircle()
src/data/       openflights.ts (URLs+parsers), localpack.ts (offline pack), continents.ts
src/api/        datasets.ts (OpenFlights fetch+cache), staticData.ts (source dispatcher)
src/context/    DataSourceContext.tsx
src/hooks/      useStaticData.ts (airports/airlines/routes/planes/countries), useLogbook.ts
src/components/  Logbook/*, Airlines/*, Aircraft/*, Settings/*
```
App pages are now `React.lazy` + `Suspense` code-split, so Leaflet and Recharts load on demand.

---

### Running the project

```bash
cd skynet
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npx tsc -b       # type-check only
```
