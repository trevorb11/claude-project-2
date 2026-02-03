'use client'

import { Badge } from '@/components/ui/badge'
import { Download, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface ExportJob {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  filterJson: any
  totalCount: number
  fileName: string | null
  error: string | null
  createdAt: Date
  completedAt: Date | null
}

interface ExportHistoryProps {
  exports: ExportJob[]
}

export function ExportHistory({ exports }: ExportHistoryProps) {
  const getStatusBadge = (status: ExportJob['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge className="gap-1 bg-blue-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
    }
  }

  const formatFilters = (filterJson: any) => {
    if (!filterJson || Object.keys(filterJson).length === 0) {
      return 'No filters'
    }

    const parts = []
    if (filterJson.text) parts.push(`Search: "${filterJson.text}"`)
    if (filterJson.includeTags?.length) parts.push(`Tags: ${filterJson.includeTags.join(', ')}`)
    if (filterJson.dispositions?.length) parts.push(`Status: ${filterJson.dispositions.join(', ')}`)
    if (filterJson.hasPhone) parts.push('Has phone')

    return parts.length > 0 ? parts.join(' | ') : 'No filters'
  }

  if (exports.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No exports yet</p>
        <p className="text-sm">Export contacts from the Contacts page to see them here</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">File</th>
            <th className="px-4 py-3 text-left font-medium">Contacts</th>
            <th className="px-4 py-3 text-left font-medium">Filters</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {exports.map((exp) => (
            <tr key={exp.id} className="border-t">
              <td className="px-4 py-3">{getStatusBadge(exp.status)}</td>
              <td className="px-4 py-3">
                {exp.fileName || (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3">{exp.totalCount.toLocaleString()}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">
                {formatFilters(exp.filterJson)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {format(new Date(exp.createdAt), 'MMM d, yyyy h:mm a')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
