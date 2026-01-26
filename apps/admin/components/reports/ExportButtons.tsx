'use client'

import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@ephraimcare/ui'
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import type { ExportFormat } from '@/lib/reports/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExportButtonsProps {
  /** Export handler for selected format */
  onExport: (format: ExportFormat) => void
  /** Disable all export options */
  disabled?: boolean
  /** Loading state during export */
  isExporting?: boolean
}

// ─── Export Options ─────────────────────────────────────────────────────────

const EXPORT_OPTIONS: Array<{
  format: ExportFormat
  label: string
  icon: typeof Download
}> = [
  { format: 'csv', label: 'Export CSV', icon: FileText },
  { format: 'excel', label: 'Export Excel', icon: FileSpreadsheet },
  { format: 'pdf', label: 'Export PDF', icon: Download },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function ExportButtons({ onExport, disabled, isExporting }: ExportButtonsProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null)

  async function handleExport(format: ExportFormat) {
    setActiveFormat(format)
    try {
      await onExport(format)
    } finally {
      setActiveFormat(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isExporting}
        >
          {isExporting ? (
            <>
              <span className="animate-spin mr-2">
                <Download className="h-4 w-4" />
              </span>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {EXPORT_OPTIONS.map(({ format, label, icon: Icon }) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={activeFormat !== null}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
