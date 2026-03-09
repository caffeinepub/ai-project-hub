/**
 * useEnsureRegistered — polls getCallerUserRole until the caller has a
 * non-guest role, meaning _initializeAccessControlWithSecret has completed
 * and the backend has registered this principal.
 *
 * Returns { isRegistered, isChecking } so the UI can gate actions on it.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./useActor";

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20; // 30 seconds total

export function useEnsureRegistered() {
  const { actor, isFetching } = useActor();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const check = useCallback(async () => {
    if (!actor || isFetching) return;
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      setIsChecking(false);
      return;
    }

    try {
      attemptsRef.current += 1;
      const role = await actor.getCallerUserRole();
      if (!mountedRef.current) return;

      // role is an enum value — check if it's not guest
      const roleStr = String(role);
      if (roleStr === "admin" || roleStr === "user") {
        setIsRegistered(true);
        setIsChecking(false);
        return;
      }
    } catch {
      // ignore — will retry
    }

    if (!mountedRef.current) return;

    // Not registered yet — schedule another attempt
    timerRef.current = setTimeout(() => {
      void check();
    }, POLL_INTERVAL_MS);
  }, [actor, isFetching]);

  useEffect(() => {
    mountedRef.current = true;
    attemptsRef.current = 0;

    if (!actor || isFetching) return;

    setIsChecking(true);
    setIsRegistered(false);
    void check();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [actor, isFetching, check]);

  return { isRegistered, isChecking };
}
