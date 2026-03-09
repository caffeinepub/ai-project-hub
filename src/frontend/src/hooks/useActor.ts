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
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString() ?? "anon"],
    queryFn: async () => {
      // Actor creation is purely local — no network call here.
      // Initialization (access control) is handled by useEnsureRegistered.
      if (!identity) {
        return await createActorWithConfig();
      }
      return await createActorWithConfig({
        agentOptions: { identity },
      });
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
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
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
