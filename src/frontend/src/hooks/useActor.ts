import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useInternetIdentity } from "./useInternetIdentity";

export const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [
      ACTOR_QUERY_KEY,
      identity?.getPrincipal().toString() ?? "__anon__",
    ],
    queryFn: async () => {
      if (!identity) {
        // Anonymous actor — no network call beyond config fetch
        return await createActorWithConfig();
      }

      // Authenticated actor — local creation only, no backend call here.
      // Registration / role check happens in useEnsureRegistered.
      return await createActorWithConfig({
        agentOptions: { identity },
      });
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
    enabled: true,
  });

  // When the actor becomes available, invalidate dependent queries so they
  // re-fetch with the authenticated actor.
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data ?? null,
    isFetching: actorQuery.isFetching,
  };
}
