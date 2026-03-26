import { useEffect, useRef, useCallback } from "react";

/**
 * Calls onLoadMore when the sentinel element scrolls into view.
 * Usage: const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading)
 */
export function useInfiniteScroll(onLoadMore, hasMore, loading) {
  const sentinelRef = useRef(null);

  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });

    observer.observe(sentinel);
    return () => observer.unobserve(sentinel);
  }, [handleObserver]);

  return sentinelRef;
}