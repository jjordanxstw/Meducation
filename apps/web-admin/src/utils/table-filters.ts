import type { CrudFilter, CrudFilters, LogicalFilter } from '@refinedev/core';
import { useEffect, useState } from 'react';

function isLogicalFilter(filter: CrudFilter): filter is LogicalFilter {
  return typeof filter === 'object' && filter !== null && 'field' in filter;
}

export function getFilterValue(filters: CrudFilters | undefined, field: string): unknown {
  if (!filters || !Array.isArray(filters)) {
    return undefined;
  }

  const matched = filters.find((filter) => isLogicalFilter(filter) && filter.field === field);
  if (!matched || !isLogicalFilter(matched)) {
    return undefined;
  }

  return matched.value;
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
