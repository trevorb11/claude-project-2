'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { X, CheckCircle, Calendar, Ban } from 'lucide-react'

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

interface BulkActionsProps {
  selectedCount: number
  onAction: (action: string, value?: string | boolean) => void
  onClear: () => void
}

export function BulkActions({ selectedCount, onAction, onClear }: BulkActionsProps) {
  const [disposition, setDisposition] = useState('')
  const [callbackDate, setCallbackDate] = useState('')

  const handleSetDisposition = () => {
    if (disposition) {
      onAction('setDisposition', disposition)
      setDisposition('')
    }
  }

  const handleSetCallback = () => {
    if (callbackDate) {
      onAction('setCallback', callbackDate)
      setCallbackDate('')
    }
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium">
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Clear selection
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Set Disposition */}
        <div className="flex items-center gap-2">
          <Select
            value={disposition}
            onChange={(e) => setDisposition(e.target.value)}
            className="w-40 h-9 text-sm"
          >
            <option value="">Set status...</option>
            {DISPOSITIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSetDisposition}
            disabled={!disposition}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Apply
          </Button>
        </div>

        {/* Set Callback */}
        <div className="flex items-center gap-2">
          <Input
            type="datetime-local"
            value={callbackDate}
            onChange={(e) => setCallbackDate(e.target.value)}
            className="w-48 h-9 text-sm"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSetCallback}
            disabled={!callbackDate}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Set Callback
          </Button>
        </div>

        {/* Clear Callback */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction('clearCallback')}
        >
          <X className="h-4 w-4 mr-1" />
          Clear Callbacks
        </Button>

        {/* Exclude from Export */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction('setExcluded', true)}
        >
          <Ban className="h-4 w-4 mr-1" />
          Exclude from Export
        </Button>

        {/* Include in Export */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction('setExcluded', false)}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Include in Export
        </Button>
      </div>
    </div>
  )
}
