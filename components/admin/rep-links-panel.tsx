'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface RepLink {
  id: string
  ghlLocationId: string
  ghlUserId: string
  createdAt: string
  user: { id: string; email: string; name: string | null }
}

interface UserOption {
  id: string
  email: string
  name: string | null
}

export function RepLinksPanel() {
  const [repLinks, setRepLinks] = useState<RepLink[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [newLink, setNewLink] = useState({
    userId: '',
    ghlLocationId: '',
    ghlUserId: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [linksRes, usersRes] = await Promise.all([
        fetch('/api/admin/rep-links'),
        fetch('/api/admin/users'),
      ])

      if (linksRes.ok) {
        const data = await linksRes.json()
        setRepLinks(data.repLinks)
      }

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newLink.userId || !newLink.ghlLocationId || !newLink.ghlUserId) return

    setCreating(true)
    try {
      const response = await fetch('/api/admin/rep-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      })

      if (response.ok) {
        await fetchData()
        setNewLink({ userId: '', ghlLocationId: '', ghlUserId: '' })
      }
    } catch (error) {
      console.error('Failed to create rep link:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/rep-links?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRepLinks((prev) => prev.filter((link) => link.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete rep link:', error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create New Link */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium mb-4">Create Rep Mapping</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="text-sm text-muted-foreground">User</label>
            <Select
              value={newLink.userId}
              onChange={(e) => setNewLink({ ...newLink, userId: e.target.value })}
              className="mt-1"
            >
              <option value="">Select user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">GHL Location ID</label>
            <Input
              value={newLink.ghlLocationId}
              onChange={(e) => setNewLink({ ...newLink, ghlLocationId: e.target.value })}
              placeholder="location_abc123..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">GHL User ID</label>
            <Input
              value={newLink.ghlUserId}
              onChange={(e) => setNewLink({ ...newLink, ghlUserId: e.target.value })}
              placeholder="user_xyz789..."
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleCreate}
              disabled={creating || !newLink.userId || !newLink.ghlLocationId || !newLink.ghlUserId}
              className="w-full"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Existing Links */}
      <div className="text-sm text-muted-foreground">
        {repLinks.length} rep mapping{repLinks.length !== 1 ? 's' : ''} configured
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">GHL Location ID</th>
              <th className="px-4 py-3 text-left font-medium">GHL User ID</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {repLinks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No rep mappings configured yet
                </td>
              </tr>
            ) : (
              repLinks.map((link) => (
                <tr key={link.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{link.user.name || 'Unknown'}</div>
                    <div className="text-muted-foreground text-xs">{link.user.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{link.ghlLocationId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{link.ghlUserId}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(link.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(link.id)}
                      disabled={deleting === link.id}
                    >
                      {deleting === link.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
