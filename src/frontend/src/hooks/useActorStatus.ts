/**
 * useActorStatus — exposes error state and retry for the actor query.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

export function useActorStatus() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalStr = identity?.getPrincipal().toString() ?? "anon";
  const queryKey = useMemo(() => ["actor", principalStr], [principalStr]);

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
