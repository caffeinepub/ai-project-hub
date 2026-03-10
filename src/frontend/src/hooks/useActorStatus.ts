/**
 * useActorStatus — exposes error state and retry for the actor query.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

// Must match the query key used in useActor.ts
const ACTOR_QUERY_KEY = "actor";

const ANON_PRINCIPAL = "__anon__";

export function useActorStatus() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalStr = identity?.getPrincipal().toString() ?? ANON_PRINCIPAL;
  const queryKey = useMemo(
    () => [ACTOR_QUERY_KEY, principalStr],
    [principalStr],
  );

  const queryState = queryClient.getQueryState(queryKey);

  const isError = queryState?.status === "error";
  const isPending =
    queryState?.status === "pending" || queryState?.fetchStatus === "fetching";
  const isSuccess = queryState?.status === "success";

  const retry = useCallback(() => {
    queryClient.resetQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { isError, isPending, isSuccess, retry };
}
