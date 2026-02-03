'use client'

import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { ContactFilter } from '@/lib/filters'

const DISPOSITIONS = [
  { value: 'NOT_CALLED', label: 'Not Called' },
  { value: 'CALLED', label: 'Called' },
  { value: 'NO_ANSWER', label: 'No Answer' },
  { value: 'LEFT_VOICEMAIL', label: 'Left Voicemail' },
  { value: 'SPOKE_WITH', label: 'Spoke With' },
  { value: 'BAD_NUMBER', label: 'Bad Number' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'DNC', label: 'Do Not Call' },
]

interface FilterBarProps {
  filter: ContactFilter
  onFilterChange: (filter: ContactFilter) => void
}

export function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  const hasActiveFilters = Object.keys(filter).some((key) => {
    const value = filter[key as keyof ContactFilter]
    return value !== undefined && value !== '' &&
           (Array.isArray(value) ? value.length > 0 : true)
  })

  const updateFilter = (key: keyof ContactFilter, value: any) => {
    const newFilter = { ...filter }
    if (value === '' || value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete newFilter[key]
    } else {
      newFilter[key] = value
    }
    onFilterChange(newFilter)
  }

  const clearFilters = () => {
    onFilterChange({})
  }

  const getActiveFilterBadges = () => {
    const badges: { key: string; label: string }[] = []

    if (filter.text) {
      badges.push({ key: 'text', label: `Search: "${filter.text}"` })
    }
    if (filter.includeTags?.length) {
      badges.push({ key: 'includeTags', label: `Tags: ${filter.includeTags.join(', ')}` })
    }
    if (filter.excludeTags?.length) {
      badges.push({ key: 'excludeTags', label: `Exclude: ${filter.excludeTags.join(', ')}` })
    }
    if (filter.dispositions?.length) {
      const labels = filter.dispositions.map(
        (d) => DISPOSITIONS.find((x) => x.value === d)?.label || d
      )
      badges.push({ key: 'dispositions', label: `Status: ${labels.join(', ')}` })
    }
    if (filter.hasPhone !== undefined) {
      badges.push({ key: 'hasPhone', label: filter.hasPhone ? 'Has phone' : 'No phone' })
    }
    if (filter.createdAfter) {
      badges.push({ key: 'createdAfter', label: `After: ${filter.createdAfter}` })
    }
    if (filter.createdBefore) {
      badges.push({ key: 'createdBefore', label: `Before: ${filter.createdBefore}` })
    }

    return badges
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Disposition Filter */}
        <Select
          value={filter.dispositions?.[0] || ''}
          onChange={(e) => {
            const value = e.target.value
            updateFilter('dispositions', value ? [value] : undefined)
          }}
          className="w-40 h-9 text-sm"
        >
          <option value="">All Statuses</option>
          {DISPOSITIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>

        {/* Has Phone Filter */}
        <Select
          value={filter.hasPhone === undefined ? '' : filter.hasPhone.toString()}
          onChange={(e) => {
            const value = e.target.value
            updateFilter('hasPhone', value === '' ? undefined : value === 'true')
          }}
          className="w-36 h-9 text-sm"
        >
          <option value="">All Contacts</option>
          <option value="true">Has Phone</option>
          <option value="false">No Phone</option>
        </Select>

        {/* Date Filter */}
        <Select
          value={filter.createdAfter || ''}
          onChange={(e) => updateFilter('createdAfter', e.target.value || undefined)}
          className="w-40 h-9 text-sm"
        >
          <option value="">Any Time</option>
          <option value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
            Last 7 days
          </option>
          <option value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
            Last 30 days
          </option>
          <option value={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
            Last 90 days
          </option>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {getActiveFilterBadges().map((badge) => (
            <Badge
              key={badge.key}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => updateFilter(badge.key as keyof ContactFilter, undefined)}
            >
              {badge.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
