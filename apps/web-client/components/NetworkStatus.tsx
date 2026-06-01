'use client';

import { useState, useSyncExternalStore } from 'react';
import { WifiOff, X } from 'lucide-react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

const getSnapshot = () => navigator.onLine;
// On the server we optimistically assume the user is online so nothing renders
// until the client hydrates with the real connectivity state.
const getServerSnapshot = () => true;

/**
 * Thin top bar that slides down when the browser loses connectivity. The
 * dismiss state resets every time the connection drops again so the user is
 * always re-notified when something actually changes.
 */
export function NetworkStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  // "Adjust state during render" pattern (React docs): when the connection
  // transitions from online -> offline we clear any previous dismissal so the
  // bar reappears for the new offline episode.
  const [prevOnline, setPrevOnline] = useState(isOnline);
  if (isOnline !== prevOnline) {
    setPrevOnline(isOnline);
    if (!isOnline) {
      setDismissed(false);
    }
  }

  const visible = !isOnline && !dismissed;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-50 transition-transform duration-200 ease-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/20 px-4 py-2 text-amber-300 backdrop-blur-sm">
        <WifiOff className="h-4 w-4 flex-shrink-0" aria-hidden />
        <span className="text-xs font-medium sm:text-sm">
          You&apos;re offline — some content may be unavailable.
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss offline notice"
          className="ml-2 rounded-md p-1 text-amber-300/70 transition-colors hover:bg-amber-500/20 hover:text-amber-200"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
