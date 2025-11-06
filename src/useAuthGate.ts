import { useEffect, useState } from 'react';
import { getCurrentUser } from './auth';

export function useAuthGate() {
  const [user, setUser] = useState<any | null | undefined>(undefined);
  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);
  return { user, isLoading: user === undefined };
}
