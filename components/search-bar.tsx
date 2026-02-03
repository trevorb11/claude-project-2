'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import type { ContactFilter } from '@/lib/filters'

interface SearchBarProps {
  onSearch: (filter: ContactFilter) => void
  currentFilter: ContactFilter
}

export function SearchBar({ onSearch, currentFilter }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [nlLoading, setNlLoading] = useState(false)
  const [nlExplanation, setNlExplanation] = useState<string | null>(null)

  const handleTextSearch = () => {
    if (!query.trim()) {
      onSearch({})
      return
    }
    onSearch({ ...currentFilter, text: query.trim() })
    setNlExplanation(null)
  }

  const handleNLSearch = async () => {
    if (!query.trim()) return

    setNlLoading(true)
    try {
      const response = await fetch('/api/search/nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) throw new Error('Search failed')

      const { filter, explanation } = await response.json()
      onSearch(filter)
      setNlExplanation(explanation)
    } catch (error) {
      console.error('NL search failed:', error)
      // Fallback to text search
      handleTextSearch()
    } finally {
      setNlLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handleNLSearch()
      } else {
        handleTextSearch()
      }
    }
  }

  return (
    <div className="flex-1 max-w-xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search contacts or use AI search (Shift+Enter)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleTextSearch} variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleNLSearch}
          disabled={nlLoading || !query.trim()}
          variant="outline"
          title="AI-powered search (Shift+Enter)"
        >
          {nlLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
      {nlExplanation && (
        <div className="mt-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded">
          <Sparkles className="h-3 w-3 inline mr-1" />
          {nlExplanation}
        </div>
      )}
    </div>
  )
}
