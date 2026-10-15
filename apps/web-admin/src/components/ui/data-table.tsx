import type * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './button';
import { Skeleton } from './skeleton';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  /** Rendered in place of the table body when there are no rows. */
  emptyState?: React.ReactNode;
  getRowId?: (row: TData) => string;
  // Manual pagination (driven by Refine core useTable).
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  total?: number;
  onPageChange: (pageIndex: number) => void;
  // Manual sorting.
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Makes the whole row clickable (e.g. open the editor). */
  onRowClick?: (row: TData) => void;
  /** Highlights a row (e.g. the one open in a side panel). */
  selectedRowId?: string | null;
  /** Extra classes per row (e.g. amber for duplicates). */
  rowClassName?: (row: TData) => string | undefined;
}

/** Page numbers with ellipses: 1 … 4 5 6 … 12. */
function pageList(current: number, count: number): Array<number | 'gap'> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const pages = new Set([0, count - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter(page => page >= 0 && page < count).sort((a, b) => a - b);
  return sorted.flatMap((page, i) =>
    i > 0 && page - sorted[i - 1] > 1 ? ['gap' as const, page] : [page]
  );
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  emptyState,
  getRowId,
  pageIndex,
  pageSize,
  pageCount,
  total,
  onPageChange,
  sorting,
  onSortingChange,
  onRowClick,
  selectedRowId,
  rowClassName,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    state: { sorting: sorting ?? [], pagination: { pageIndex, pageSize } },
    onSortingChange,
    getRowId: getRowId ? row => getRowId(row) : undefined,
  });

  const showEmpty = !loading && data.length === 0;
  const firstRow = pageIndex * pageSize + 1;
  const lastRow = pageIndex * pageSize + data.length;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-200/70">
                  {headerGroup.headers.map(header => {
                    // Only advertise sorting when the page actually wires it up,
                    // so non-sortable lists don't show dead sort affordances.
                    const canSort = header.column.getCanSort() && Boolean(onSortingChange);
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className="whitespace-nowrap px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-ink-3"
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-600"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? (
                              <ArrowUp className="size-3" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="size-3" />
                            ) : (
                              <ChevronsUpDown className="size-3 opacity-50" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-slate-100 last:border-0">
                    {columns.map((_col, colIdx) => (
                      <td key={colIdx} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : showEmpty ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16">
                    {emptyState ?? <p className="text-center text-sm text-ink-3">No data</p>}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    aria-selected={selectedRowId ? row.id === selectedRowId : undefined}
                    className={
                      'border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70' +
                      (onRowClick ? ' cursor-pointer' : '') +
                      (selectedRowId && row.id === selectedRowId
                        ? ' bg-brand/[0.07] hover:bg-brand/[0.07]'
                        : '') +
                      (rowClassName?.(row.original) ? ` ${rowClassName(row.original)}` : '')
                    }
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-2.5 text-[13px] text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination (outside the card, Brilliant: Subjects & lectures) */}
      {!loading && data.length > 0 ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-3 tabular-nums">
            {typeof total === 'number'
              ? `Showing ${firstRow}–${lastRow} of ${total}`
              : `Page ${pageIndex + 1} of ${Math.max(pageCount, 1)}`}
          </p>
          {pageCount > 1 ? (
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pageIndex <= 0}
                onClick={() => onPageChange(pageIndex - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>
              {pageList(pageIndex, pageCount).map((page, i) =>
                page === 'gap' ? (
                  <span key={`gap-${i}`} className="px-1 text-xs text-ink-3">
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange(page)}
                    aria-current={page === pageIndex ? 'page' : undefined}
                    className={
                      'flex size-8 items-center justify-center rounded-lg text-xs font-medium tabular-nums transition-colors ' +
                      (page === pageIndex
                        ? 'bg-ink-1 text-white'
                        : 'border border-slate-200 bg-white text-ink-2 hover:border-slate-300')
                    }
                  >
                    {page + 1}
                  </button>
                )
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pageIndex + 1 >= pageCount}
                onClick={() => onPageChange(pageIndex + 1)}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
            </nav>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type { ColumnDef, SortingState };
