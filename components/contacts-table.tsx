'use client'

import { useState } from 'react'
import { formatPhone, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp, Phone, Mail, Building2, Calendar, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import type { Contact } from './contacts-view'

const DISPOSITIONS = [
  { value: 'NOT_CALLED', label: 'Not Called', color: 'bg-gray-100 text-gray-700' },
  { value: 'CALLED', label: 'Called', color: 'bg-blue-100 text-blue-700' },
  { value: 'NO_ANSWER', label: 'No Answer', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'LEFT_VOICEMAIL', label: 'Left Voicemail', color: 'bg-purple-100 text-purple-700' },
  { value: 'SPOKE_WITH', label: 'Spoke With', color: 'bg-green-100 text-green-700' },
  { value: 'BAD_NUMBER', label: 'Bad Number', color: 'bg-red-100 text-red-700' },
  { value: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-orange-100 text-orange-700' },
  { value: 'NOT_INTERESTED', label: 'Not Interested', color: 'bg-gray-200 text-gray-700' },
  { value: 'CONVERTED', label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'DNC', label: 'Do Not Call', color: 'bg-red-200 text-red-800' },
]

interface ContactsTableProps {
  contacts: Contact[]
  loading: boolean
  selectedIds: Set<string>
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (column: string) => void
  onSelectAll: (checked: boolean) => void
  onSelectOne: (id: string, checked: boolean) => void
  onStateUpdate: (contactId: string, updates: Partial<Contact>) => void
}

export function ContactsTable({
  contacts,
  loading,
  selectedIds,
  sortBy,
  sortOrder,
  onSort,
  onSelectAll,
  onSelectOne,
  onStateUpdate,
}: ContactsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')

  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id))

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline" />
    ) : (
      <ChevronDown className="h-4 w-4 inline" />
    )
  }

  const getDispositionStyle = (disposition: string) => {
    return DISPOSITIONS.find((d) => d.value === disposition)?.color || 'bg-gray-100'
  }

  const handleNoteSubmit = (contactId: string) => {
    onStateUpdate(contactId, { note: noteValue })
    setEditingNote(null)
    setNoteValue('')
  }

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No contacts found. Try adjusting your filters.
      </div>
    )
  }

  return (
    <div className="table-container bg-white">
      <table>
        <thead>
          <tr>
            <th className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-300"
              />
            </th>
            <th
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('firstName')}
            >
              Name <SortIcon column="firstName" />
            </th>
            <th>Phone</th>
            <th
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('company')}
            >
              Company <SortIcon column="company" />
            </th>
            <th>Tags</th>
            <th>Disposition</th>
            <th
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('createdAt')}
            >
              Created <SortIcon column="createdAt" />
            </th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <>
              <tr key={contact.id} className={cn(selectedIds.has(contact.id) && 'bg-primary/5')}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(contact.id)}
                    onChange={(e) => onSelectOne(contact.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td>
                  <div className="font-medium">
                    {contact.firstName || contact.lastName
                      ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                      : 'Unknown'}
                  </div>
                  {contact.email && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </div>
                  )}
                </td>
                <td>
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {formatPhone(contact.phone)}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No phone</span>
                  )}
                </td>
                <td>
                  {contact.company ? (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {contact.company}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {(contact.tags || []).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(contact.tags || []).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{contact.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td>
                  <Select
                    value={contact.disposition}
                    onChange={(e) =>
                      onStateUpdate(contact.id, { disposition: e.target.value })
                    }
                    className={cn(
                      'h-8 text-xs font-medium border-0',
                      getDispositionStyle(contact.disposition)
                    )}
                  >
                    {DISPOSITIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="text-sm text-muted-foreground">
                  {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                </td>
                <td>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setExpandedId(expandedId === contact.id ? null : contact.id)
                    }
                  >
                    {expandedId === contact.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </td>
              </tr>

              {/* Expanded Row */}
              {expandedId === contact.id && (
                <tr>
                  <td colSpan={8} className="bg-gray-50 p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          Notes
                        </label>
                        {editingNote === contact.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={noteValue}
                              onChange={(e) => setNoteValue(e.target.value)}
                              placeholder="Add a note..."
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleNoteSubmit(contact.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNote(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNote(contact.id)
                              setNoteValue(contact.note || '')
                            }}
                            className="min-h-[60px] p-2 bg-white border rounded cursor-pointer hover:border-primary text-sm"
                          >
                            {contact.note || (
                              <span className="text-muted-foreground">
                                Click to add note...
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Callback */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Callback Date
                        </label>
                        <Input
                          type="datetime-local"
                          value={
                            contact.callbackAt
                              ? new Date(contact.callbackAt)
                                  .toISOString()
                                  .slice(0, 16)
                              : ''
                          }
                          onChange={(e) =>
                            onStateUpdate(contact.id, {
                              callbackAt: e.target.value || null,
                            })
                          }
                          className="text-sm"
                        />
                      </div>

                      {/* Export Toggle */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Export Status</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={contact.excludedFromExport}
                            onChange={(e) =>
                              onStateUpdate(contact.id, {
                                excludedFromExport: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Exclude from export</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                      <div className="flex gap-6">
                        <span>
                          <strong>GHL ID:</strong> {contact.ghlContactId}
                        </span>
                        {contact.lastActivityAt && (
                          <span>
                            <strong>Last Activity:</strong>{' '}
                            {format(
                              new Date(contact.lastActivityAt),
                              'MMM d, yyyy h:mm a'
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
