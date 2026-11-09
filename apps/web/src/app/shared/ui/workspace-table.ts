import { computed, Signal } from '@angular/core';
import { ColumnDef, createTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel } from '@tanstack/table-core';

export function workspaceRows<T extends { id: number }>(
  data: Signal<T[]>, search: Signal<string>, searchable: (row: T) => string,
  date: (row: T) => string, descending: Signal<boolean>,
) {
  const columns: ColumnDef<T>[] = [
    { id: 'search', accessorFn: searchable, enableGlobalFilter: true },
    { id: 'date', accessorFn: date, enableGlobalFilter: false },
  ];
  const table = createTable({
    data: [], columns, state: {}, onStateChange: () => undefined, renderFallbackValue: null,
    getRowId: row => String(row.id),
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return computed(() => {
    table.setOptions(options => ({
      ...options, data: data(),
      state: { globalFilter: search().trim(), columnFilters: [], sorting: [{ id: 'date', desc: descending() }] },
    }));
    return table.getRowModel().rows.map(row => row.original);
  });
}
