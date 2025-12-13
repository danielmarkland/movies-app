"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalResults: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ currentPage, totalPages, totalResults, onPageChange }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{totalResults?.toLocaleString() ?? 0}</span> results found
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground px-2">
          Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1 cursor-pointer"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
