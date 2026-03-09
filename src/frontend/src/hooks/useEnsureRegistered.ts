/**
 * useEnsureRegistered — returns true once the actor has been initialized,
 * which means _initializeAccessControlWithSecret has already completed
 * (it is awaited inside useActor before the actor is returned).
 *
 * No polling needed: if actor is non-null, the user is registered.
 */
import { useActor } from "./useActor";

export function useEnsureRegistered() {
  const { actor, isFetching } = useActor();
  const isRegistered = !!actor && !isFetching;
  const isChecking = isFetching;
  return { isRegistered, isChecking };
}
