'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Loader2, AlertCircle } from 'lucide-react'
import type { ContactFilter } from '@/lib/filters'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  filter: ContactFilter
  selectedIds: string[]
}

interface PreviewData {
  count: number
  hasPhone: number
  excluded: number
  maxExport: number
}

export function ExportModal({ open, onClose, filter, selectedIds }: ExportModalProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchPreview()
    }
  }, [open, filter, selectedIds])

  const fetchPreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/exports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter,
          selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
        }),
      })

      if (!response.ok) throw new Error('Preview failed')

      const data = await response.json()
      setPreview(data)
    } catch (err) {
      setError('Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const response = await fetch('/api/exports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter,
          selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Export failed')
      }

      // Download the CSV
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Export Contacts</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : preview ? (
            <>
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contacts to export:</span>
                  <span className="font-medium">{preview.count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With phone numbers:</span>
                  <span className="font-medium">{preview.hasPhone.toLocaleString()}</span>
                </div>
                {preview.excluded > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Excluded from export:</span>
                    <span className="font-medium">{preview.excluded}</span>
                  </div>
                )}
              </div>

              {selectedIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Exporting {selectedIds.length} selected contacts
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <strong>Export format:</strong> CSV file compatible with Kixie PowerList
                <br />
                <strong>Columns:</strong> Phone, First Name, Last Name, Company, Email, Contact ID, Tags, Disposition, Callback At
              </div>

              {preview.count >= preview.maxExport && (
                <div className="flex items-start gap-2 text-orange-600 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Export limited to {preview.maxExport.toLocaleString()} contacts. Use filters to narrow your selection.
                  </span>
                </div>
              )}
            </>
          ) : null}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || loading || !preview || preview.count === 0}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
