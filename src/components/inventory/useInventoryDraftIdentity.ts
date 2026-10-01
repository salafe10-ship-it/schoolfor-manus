import { useRef } from 'react';

export function useInventoryDraftIdentity(prefix: string) {
  const draft = useRef<{ id: string; createdAt: string } | null>(null);
  const identity = () => {
    if (!draft.current) draft.current = { id: `${prefix}_${crypto.randomUUID()}`, createdAt: new Date().toISOString() };
    return draft.current;
  };
  return { identity, reset: () => { draft.current = null; } };
}
