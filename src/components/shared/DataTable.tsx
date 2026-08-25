"use client"

import { useState, useMemo } from "react"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  className?: string;
  render?: (row: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  onSort?: (key: string, direction: "asc" | "desc") => void
  searchable?: boolean
  searchPlaceholder?: string
  loading?: boolean
  emptyMessage?: string
  keyExtractor?: (row: T, index: number) => string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pagination,
  onSort,
  searchable = false,
  searchPlaceholder = "Search...",
  loading = false,
  emptyMessage = "No data found",
  keyExtractor,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const filteredData = useMemo(() => {
    if (!search) return data
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key]
        return val !== undefined && val !== null && String(val).toLowerCase().includes(search.toLowerCase())
      })
    )
  }, [data, search, columns])

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1

  function handleSort(key: string) {
    const col = columns.find((c) => c.key === key)
    if (!col?.sortable) return
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc"
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  function renderCell(row: T, col: Column<T>, index: number) {
    if (col.render) return col.render(row, index)
    const val = row[col.key]
    if (val === null || val === undefined) return "-"
    return String(val)
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        {searchable && (
          <div className="border-b border-[#D9E0E8] p-4">
            <Skeleton className="h-9 w-64" />
          </div>
        )}
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-[#F5F7FA] py-3">
              {columns.map((col) => (
                <div key={col.key} className="flex-1">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#D9E0E8] bg-white">
      {searchable && (
        <div className="border-b border-[#D9E0E8] p-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-9"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]",
                    col.sortable && "cursor-pointer select-none hover:text-[#172033]",
                    col.className
                  )}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-[#D4145A]">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#6B7280]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr
                  key={keyExtractor?.(row, i) ?? i}
                  className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 text-[#172033]", col.className)}
                    >
                      {renderCell(row, col, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between border-t border-[#D9E0E8] px-4 py-3">
          <p className="text-xs text-[#6B7280]">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(1)}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-sm font-medium text-[#172033]">
              {pagination.page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(totalPages)}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
