/**
 * useEnsureRegistered — initialises access control for the authenticated
 * caller and verifies they are registered on the backend.
 *
 * Actor creation is kept separate (useActor). Registration (network call)
 * happens here with up to 5 retries.
 */
import { useQuery } from "@tanstack/react-query";
import { UserRole } from "../backend.d";
import { getSecretParameter } from "../utils/urlParams";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useEnsureRegistered() {
  const { actor, isFetching: actorLoading } = useActor();
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString();

  const roleQuery = useQuery<UserRole>({
    queryKey: ["userRole", principalStr],
    queryFn: async () => {
      if (!actor || !identity) return UserRole.guest;

      const adminToken = getSecretParameter("caffeineAdminToken") || "";

      // Step 1: Initialise access control (registers the caller if needed).
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (actor as any)._initializeAccessControlWithSecret(adminToken);
      } catch {
        // May fail if already initialised — continue to role check.
      }

      // Step 2: Check role with retries via React Query.
      try {
        const role = await actor.getCallerUserRole();
        if (role === UserRole.admin || role === UserRole.user) return role;
      } catch {
        // Ignore — will retry via React Query
      }

      return UserRole.guest;
    },
    enabled: !!actor && !actorLoading && !!identity,
    retry: 5,
    retryDelay: (attempt) => Math.min(1500 * (attempt + 1), 8_000),
    staleTime: 5 * 60 * 1000,
  });

  const isRegistered =
    roleQuery.data === UserRole.admin || roleQuery.data === UserRole.user;
  const isChecking = roleQuery.isLoading || roleQuery.isFetching;

  return { isRegistered, isChecking };
}
