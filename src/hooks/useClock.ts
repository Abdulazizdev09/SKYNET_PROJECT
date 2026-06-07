import { useEffect, useState } from 'react';

/** Current time, re-rendered every second (for the sidebar UTC clock). */
export function useClock(): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
