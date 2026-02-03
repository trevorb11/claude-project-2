'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bookmark, Plus, X, Loader2 } from 'lucide-react'
import type { ContactFilter } from '@/lib/filters'

interface SavedSearch {
  id: string
  name: string
  filterJson: ContactFilter
}

interface SavedSearchesProps {
  currentFilter: ContactFilter
  onSelect: (filter: ContactFilter) => void
}

export function SavedSearches({ currentFilter, onSelect }: SavedSearchesProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSearches()
  }, [])

  const fetchSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches')
      if (response.ok) {
        const data = await response.json()
        setSearches(data.searches)
      }
    } catch (error) {
      console.error('Failed to fetch searches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!saveName.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          filter: currentFilter,
        }),
      })

      if (response.ok) {
        await fetchSearches()
        setSaveName('')
        setShowSaveForm(false)
      }
    } catch (error) {
      console.error('Failed to save search:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSearches((prev) => prev.filter((s) => s.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete search:', error)
    }
  }

  const hasCurrentFilter = Object.keys(currentFilter).some((key) => {
    const value = currentFilter[key as keyof ContactFilter]
    return value !== undefined && value !== '' &&
           (Array.isArray(value) ? value.length > 0 : true)
  })

  if (loading) {
    return null
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Bookmark className="h-4 w-4" />
        Saved:
      </span>

      {searches.map((search) => (
        <Badge
          key={search.id}
          variant="outline"
          className="cursor-pointer hover:bg-secondary group"
          onClick={() => onSelect(search.filterJson)}
        >
          {search.name}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(search.id)
            }}
            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {showSaveForm ? (
        <div className="flex items-center gap-2">
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Search name..."
            className="h-7 w-32 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setShowSaveForm(false)
            }}
            autoFocus
          />
          <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowSaveForm(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : hasCurrentFilter ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSaveForm(true)}
          className="h-6 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Save current
        </Button>
      ) : null}
    </div>
  )
}
