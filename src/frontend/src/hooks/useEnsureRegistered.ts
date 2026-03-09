/**
 * useEnsureRegistered — verifies the backend actually knows who the caller is
 * by querying their role. If they come back as #guest it means registration
 * hasn't completed yet and we retry automatically (up to 5 times).
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

      try {
        const role = await actor.getCallerUserRole();
        if (role === UserRole.admin || role === UserRole.user) return role;
      } catch {
        // ignore — likely not registered yet
      }

      // Not registered yet — attempt registration then re-check
      try {
        const adminToken = getSecretParameter("caffeineAdminToken") || "";
        await actor._initializeAccessControlWithSecret(adminToken);
        const role2 = await actor.getCallerUserRole();
        if (role2 === UserRole.admin || role2 === UserRole.user) return role2;
      } catch (err) {
        console.warn("[useEnsureRegistered] registration retry failed:", err);
      }

      return UserRole.guest;
    },
    enabled: !!actor && !actorLoading && !!identity,
    retry: 5,
    retryDelay: (attempt) => Math.min(1500 * (attempt + 1), 8_000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isRegistered =
    roleQuery.data === UserRole.admin || roleQuery.data === UserRole.user;
  const isChecking = roleQuery.isLoading || roleQuery.isFetching;

  return { isRegistered, isChecking };
}
