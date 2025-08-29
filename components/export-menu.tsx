"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, File, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export-utils"

type Organization = {
  id: number
  name: string
  category: string
  location: string
  address: string
  employees: string
  website: string
  phone: string
  email: string
  twitter: string
  linkedin: string
  description: string
  organizationType: string[]
  founded: number
}

interface ExportMenuProps {
  organizations: Organization[]
  filters?: {
    searchTerm?: string
    category?: string
    employeeSize?: string
  }
  disabled?: boolean
}

export function ExportMenu({ organizations, filters, disabled = false }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const handleExport = async (type: 'pdf' | 'excel' | 'csv') => {
    if (organizations.length === 0) return

    setIsExporting(type)
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      switch (type) {
        case 'pdf':
          exportToPDF(organizations, filters)
          break
        case 'excel':
          exportToExcel(organizations, filters)
          break
        case 'csv':
          exportToCSV(organizations)
          break
      }
    } catch (error) {
      console.error(`Error exporting ${type}:`, error)
      // You could add a toast notification here
    } finally {
      setIsExporting(null)
    }
  }

  const getExportCount = () => {
    return organizations.length
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || organizations.length === 0}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            Export ({getExportCount()})
          </span>
          <span className="sm:hidden">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Export {getExportCount()} organization{getExportCount() !== 1 ? 's' : ''}
        </div>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting !== null}
          className="flex items-center gap-2 cursor-pointer"
        >
          {isExporting === 'pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 text-red-500" />
          )}
          <div className="flex flex-col">
            <span>PDF Report</span>
            <span className="text-xs text-muted-foreground">
              Formatted table view
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting !== null}
          className="flex items-center gap-2 cursor-pointer"
        >
          {isExporting === 'excel' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
          )}
          <div className="flex flex-col">
            <span>Excel Workbook</span>
            <span className="text-xs text-muted-foreground">
              Full data with summary
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting !== null}
          className="flex items-center gap-2 cursor-pointer"
        >
          {isExporting === 'csv' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <File className="h-4 w-4 text-blue-500" />
          )}
          <div className="flex flex-col">
            <span>CSV File</span>
            <span className="text-xs text-muted-foreground">
              Raw data format
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
