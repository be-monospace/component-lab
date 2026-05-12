import { useEffect, useState } from 'react';

// Minimal hash-based route. `#/tabs` → "tabs".
export function useHashRoute(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(() => parse(location.hash));

  useEffect(() => {
    const onHashChange = () => setId(parse(location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: string | null) => {
    location.hash = next ? `/${next}` : '/';
  };
  return [id, navigate];
}

function parse(hash: string): string | null {
  const m = hash.match(/^#\/([^/?#]+)/);
  return m ? m[1]! : null;
}
