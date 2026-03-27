import { useEffect, useRef } from "react";
import { useSearchStore } from "../store/search.store";

export function useSearch() {
  const store = useSearchStore();
  const debounceRef = useRef(null);

  // Debounced search — fires 400ms after typing stops
  const debouncedSearch = (query) => {
    store.setQuery(query);
    clearTimeout(debounceRef.current);
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        store.search(query);
      }, 400);
    }
  };

  // Immediate search — for Enter key or button click
  const immediateSearch = (query) => {
    clearTimeout(debounceRef.current);
    const q = query ?? store.query;
    if (q?.trim().length >= 2) {
      store.search(q);
    }
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return {
    query: store.query,
    mode: store.mode,
    typeFilter: store.typeFilter,
    results: store.results,
    total: store.total,
    resultMode: store.resultMode,
    loading: store.loading,
    searched: store.searched,
    error: store.error,
    debouncedSearch,
    immediateSearch,
    search: store.search,
    setMode: store.setMode,
    setTypeFilter: store.setTypeFilter,
    setQuery: store.setQuery,
    clearSearch: store.clearSearch,
  };
}