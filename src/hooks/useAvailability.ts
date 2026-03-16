import { useState, useEffect } from 'react';

const BASE = 3;
const STORAGE_KEY = 'cogniiq_avail';
const SESSION_KEY = 'cogniiq_avail_ts';

function getSeededCount(): number {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  const ts = sessionStorage.getItem(SESSION_KEY);
  const now = Date.now();

  if (stored && ts && now - parseInt(ts) < 30 * 60 * 1000) {
    return parseInt(stored);
  }

  const dayOfYear = Math.floor(now / 86400000);
  const seed = (dayOfYear * 2654435761) >>> 0;
  const count = (seed % 3) + 1;

  sessionStorage.setItem(STORAGE_KEY, String(count));
  sessionStorage.setItem(SESSION_KEY, String(now));
  return count;
}

export function useAvailability() {
  const [count, setCount] = useState(BASE);

  useEffect(() => {
    setCount(getSeededCount());
  }, []);

  const label = `${count} Platz${count === 1 ? '' : 'plätze'} frei`;
  const isLow = count <= 2;

  return { count, label, isLow };
}
