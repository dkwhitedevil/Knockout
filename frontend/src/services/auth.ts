import { UserProfile } from '@/lib/gameTypes';

function getCurrentUserSync(): UserProfile | null {
  try {
    const raw = localStorage.getItem('mock_user');
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  return getCurrentUserSync();
}

export async function signOut(): Promise<void> {
  localStorage.removeItem('mock_user');
  window.dispatchEvent(new CustomEvent('mockAuthChange', { detail: null }));
}

export function onAuthStateChange(handler: (user: UserProfile | null) => void) {
  const listener = (e: Event) => {
    const detail = (e as CustomEvent).detail as UserProfile | null;
    handler(detail ?? getCurrentUserSync());
  };
  window.addEventListener('mockAuthChange', listener);
  // initial call
  handler(getCurrentUserSync());
  return {
    unsubscribe() {
      window.removeEventListener('mockAuthChange', listener);
    },
  };
}

// Utility for tests/dev: set a mock user and emit change
export function __setMockUser(user: UserProfile | null) {
  if (user) localStorage.setItem('mock_user', JSON.stringify(user));
  else localStorage.removeItem('mock_user');
  window.dispatchEvent(new CustomEvent('mockAuthChange', { detail: user }));
}
