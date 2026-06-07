import { useMemo } from 'react';
import { useSchedules } from '../../hooks/useSchedules';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { SortRace } from './SortRace';
import { KmpSearch } from './KmpSearch';

export function Analytics() {
  const { data: flights, loading } = useSchedules();
  const values = useMemo(() => flights.slice(0, 24).map((f) => f.depMinutes), [flights]);

  if (loading) {
    return (
      <div className="page-enter flex h-full flex-col gap-6 p-6">
        <Card className="p-5">
          <Skeleton className="mb-4 h-5 w-64" />
          <div className="grid grid-cols-2 gap-5">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton className="h-80 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="page-enter flex h-full flex-col gap-6 overflow-auto p-6">
      <SortRace values={values} />
      <KmpSearch />
    </div>
  );
}
