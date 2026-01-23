'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SESSION_TIMEOUT_MS } from '@ephraimcare/utils';

/**
 * AUTH-03: Session timeout after inactivity.
 * Monitors user activity and redirects to login when idle
 * for longer than SESSION_TIMEOUT_MS (8 hours).
 *
 * Listens for: mousemove, keydown, click, scroll, touchstart
 */
export function useSessionTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      // Session expired due to inactivity
      router.replace('/login?reason=timeout');
    }, SESSION_TIMEOUT_MS);
  }, [router]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Start the timer
    resetTimer();

    // Reset on any user activity
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);
}
