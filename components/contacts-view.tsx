'use client'

import { useState, useEffect, useCallback } from 'react'
import { ContactsTable } from './contacts-table'
import { SearchBar } from './search-bar'
import { FilterBar } from './filter-bar'
import { BulkActions } from './bulk-actions'
import { ExportModal } from './export-modal'
import { SavedSearches } from './saved-searches'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'
import type { ContactFilter } from '@/lib/filters'

export interface Contact {
  id: string
  ghlContactId: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  email: string | null
  company: string | null
  tags: string[]
  createdAt: string
  lastActivityAt: string | null
  disposition: string
  note: string | null
  callbackAt: string | null
  excludedFromExport: boolean
}

interface SearchResult {
  contacts: Contact[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ContactFilter>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showExportModal, setShowExportModal] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/contacts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter, page, pageSize, sortBy, sortOrder }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: SearchResult = await response.json()
      setContacts(data.contacts)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, page, pageSize, sortBy, sortOrder])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleSearch = (newFilter: ContactFilter) => {
    setFilter(newFilter)
    setPage(1)
    setSelectedIds(new Set())
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(contacts.map((c) => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkAction = async (
    action: string,
    value?: string | boolean
  ) => {
    if (selectedIds.size === 0) return

    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: Array.from(selectedIds),
          action,
          value,
        }),
      })

      if (!response.ok) {
        throw new Error('Bulk action failed')
      }

      // Refresh contacts
      await fetchContacts()
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Bulk action failed:', error)
    }
  }

  const handleStateUpdate = async (
    contactId: string,
    updates: Partial<Contact>
  ) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }

      // Update local state
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId ? { ...c, ...updates } : c
        )
      )
    } catch (error) {
      console.error('State update failed:', error)
    }
  }

  const handleSavedSearchSelect = (savedFilter: ContactFilter) => {
    setFilter(savedFilter)
    setPage(1)
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar onSearch={handleSearch} currentFilter={filter} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchContacts()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Saved Searches */}
      <SavedSearches
        currentFilter={filter}
        onSelect={handleSavedSearchSelect}
      />

      {/* Filter Bar */}
      <FilterBar filter={filter} onFilterChange={handleSearch} />

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <BulkActions
          selectedCount={selectedIds.size}
          onAction={handleBulkAction}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {contacts.length} of {total.toLocaleString()} contacts
        {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
      </div>

      {/* Table */}
      <ContactsTable
        contacts={contacts}
        loading={loading}
        selectedIds={selectedIds}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onStateUpdate={handleStateUpdate}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        filter={filter}
        selectedIds={Array.from(selectedIds)}
      />
    </div>
  )
}
