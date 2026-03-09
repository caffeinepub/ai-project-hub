/**
 * useActorStatus — exposes error state and retry for the actor query.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { ACTOR_QUERY_KEY } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

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
