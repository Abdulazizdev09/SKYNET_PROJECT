import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Cloud, Database, HardDrive, Trash2, Zap } from 'lucide-react';
import { useDataSource } from '../../context/DataSourceContext';
import type { LiveSourceId, StaticSourceId } from '../../types/source';
import { clearDatasetCache, getCacheInfo } from '../../api/datasets';
import { clearStaticMemo } from '../../hooks/useStaticData';
import { HAS_AIRLABS_KEY } from '../../api/airlabs';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type CacheInfo = Record<'airports' | 'airlines' | 'routes' | 'planes' | 'countries', boolean>;

const CACHE_DATASETS: { key: keyof CacheInfo; label: string }[] = [
  { key: 'airports', label: 'Airports' },
  { key: 'airlines', label: 'Airlines' },
  { key: 'routes', label: 'Routes' },
  { key: 'planes', label: 'Planes' },
  { key: 'countries', label: 'Countries' },
];

interface TileOption<TId extends string> {
  id: TId;
  label: string;
  desc: string;
  icon: ReactNode;
  available: boolean;
}

const STATIC_TILES: TileOption<StaticSourceId>[] = [
  {
    id: 'openflights',
    label: 'OpenFlights',
    desc: 'Full datasets fetched from GitHub — ~10k airports, 67k routes',
    icon: <Database size={18} />,
    available: true,
  },
  {
    id: 'airlabs',
    label: 'AirLabs',
    desc: 'Live API',
    icon: <Cloud size={18} />,
    available: HAS_AIRLABS_KEY,
  },
  {
    id: 'local',
    label: 'Local bundled',
    desc: '50 hubs, fully offline',
    icon: <HardDrive size={18} />,
    available: true,
  },
];

const LIVE_TILES: TileOption<LiveSourceId>[] = [
  {
    id: 'opensky',
    label: 'OpenSky',
    desc: 'Live ADS-B aircraft positions, polled every 10s',
    icon: <Cloud size={18} />,
    available: true,
  },
  {
    id: 'airlabs',
    label: 'AirLabs',
    desc: 'Live API',
    icon: <Cloud size={18} />,
    available: HAS_AIRLABS_KEY,
  },
  {
    id: 'simulated',
    label: 'Simulated (local)',
    desc: 'Generated aircraft motion, fully offline',
    icon: <Zap size={18} />,
    available: true,
  },
];

interface SourceTileProps<TId extends string> {
  option: TileOption<TId>;
  active: boolean;
  onSelect: (id: TId) => void;
}

function SourceTile<TId extends string>({ option, active, onSelect }: SourceTileProps<TId>) {
  const disabled = !option.available;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      className={`relative flex flex-col gap-2 rounded-card border p-4 text-left transition-all duration-150 ${
        active
          ? 'border-primary bg-primary-light'
          : 'border-ink-200 bg-white hover:border-primary hover:bg-ink-50'
      } ${disabled ? 'cursor-not-allowed opacity-50 hover:border-ink-200 hover:bg-white' : 'cursor-pointer'}`}
    >
      {active && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
          <Check size={13} />
        </span>
      )}
      <span className={active ? 'text-primary' : 'text-ink-600'}>{option.icon}</span>
      <span className="text-sm font-bold text-ink-900">{option.label}</span>
      <span className="text-xs leading-relaxed text-ink-600">{option.desc}</span>
    </button>
  );
}

export function DataSourceManager() {
  const { staticSource, liveSource, setStaticSource, setLiveSource, resetToLocal } = useDataSource();

  const [cache, setCache] = useState<CacheInfo | null>(null);
  const [clearing, setClearing] = useState(false);

  const loadCache = useCallback(async () => {
    const info = await getCacheInfo();
    setCache(info);
  }, []);

  useEffect(() => {
    void loadCache();
  }, [loadCache]);

  const handleClearCache = useCallback(async () => {
    setClearing(true);
    try {
      await clearDatasetCache();
      clearStaticMemo();
      await loadCache();
    } finally {
      setClearing(false);
    }
  }, [loadCache]);

  const handleStaticSelect = useCallback(
    (id: StaticSourceId) => setStaticSource(id),
    [setStaticSource],
  );
  const handleLiveSelect = useCallback((id: LiveSourceId) => setLiveSource(id), [setLiveSource]);

  return (
    <div className="page-enter h-full overflow-auto p-6">
      <div className="flex flex-col gap-6">
        {/* ── Static data source ──────────────────────────────── */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-ink-900">Static data source</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STATIC_TILES.map((tile) => (
              <SourceTile
                key={tile.id}
                option={tile}
                active={staticSource === tile.id}
                onSelect={handleStaticSelect}
              />
            ))}
          </div>
        </Card>

        {/* ── Live aircraft source ────────────────────────────── */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Cloud size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-ink-900">Live aircraft source</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LIVE_TILES.map((tile) => (
              <SourceTile
                key={tile.id}
                option={tile}
                active={liveSource === tile.id}
                onSelect={handleLiveSelect}
              />
            ))}
          </div>
        </Card>

        {/* ── One-click local reset ───────────────────────────── */}
        <Button
          variant="primary"
          icon={<HardDrive size={18} />}
          onClick={resetToLocal}
          className="w-full"
        >
          Use Local Data — one click
        </Button>

        {/* ── Dataset cache ───────────────────────────────────── */}
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HardDrive size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-ink-900">Dataset cache</h3>
            </div>
            <Button
              variant="ghost"
              icon={<Trash2 size={16} />}
              onClick={handleClearCache}
              disabled={clearing || cache === null}
            >
              {clearing ? 'Clearing…' : 'Clear cache'}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {CACHE_DATASETS.map((ds) => {
              const cached = cache?.[ds.key] ?? false;
              return (
                <div
                  key={ds.key}
                  className="flex items-center justify-between rounded-card border border-ink-100 px-4 py-3"
                >
                  <span className="text-sm font-medium text-ink-900">{ds.label}</span>
                  {cached ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                      <Check size={15} className="text-success" />
                      Cached
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-ink-400">
                      <span className="inline-block h-px w-3 bg-ink-300" aria-hidden />
                      Not cached
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink-600">
            Reload the page to re-fetch from the active source.
          </p>
        </Card>
      </div>
    </div>
  );
}
