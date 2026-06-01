import { useMemo } from 'react';
import type { CrudSort } from '@refinedev/core';
import type { SortingState } from '@/components/ui/data-table';

/**
 * Bridges Refine core's `useTable` sorters to the TanStack-Table `SortingState`
 * the DataTable expects, and maps changes back to `setSorters` (which the data
 * provider forwards as `sortBy`/`sortOrder` query params).
 */
export function useTableSorting(
  sorters: CrudSort[],
  setSorters: (sorters: CrudSort[]) => void,
) {
  const sorting: SortingState = useMemo(
    () => sorters.filter((s) => s.order).map((s) => ({ id: s.field, desc: s.order === 'desc' })),
    [sorters],
  );

  const onSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    setSorters(next.map((s) => ({ field: s.id, order: s.desc ? 'desc' : 'asc' })));
  };

  return { sorting, onSortingChange };
}
