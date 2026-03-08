/**
 * useActorStatus — exposes the full React Query state for the actor query
 * so that pages can detect errors and trigger retries without modifying
 * the protected useActor.ts file.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

export function useActorStatus() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalStr = identity?.getPrincipal().toString() ?? undefined;
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
