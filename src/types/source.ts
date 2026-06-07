/** Which provider supplies the static datasets (airports/airlines/routes/...). */
export type StaticSourceId = 'openflights' | 'airlabs' | 'local';

/** Which provider supplies live aircraft positions. */
export type LiveSourceId = 'opensky' | 'airlabs' | 'simulated';

export interface DataSourceState {
  staticSource: StaticSourceId;
  liveSource: LiveSourceId;
}

export interface SourceMeta {
  id: string;
  label: string;
  description: string;
  /** Whether credentials/availability requirements are met. */
  available: boolean;
}
