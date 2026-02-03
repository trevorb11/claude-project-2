'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, User } from 'lucide-react'
import { format } from 'date-fns'

interface UserData {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'REP'
  createdAt: string
  repLinks: { id: string; ghlLocationId: string; ghlUserId: string }[]
  _count: { contactStates: number }
}

export function UsersPanel() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (userId: string, role: string) => {
    setUpdating(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role: role as 'ADMIN' | 'REP' } : u
          )
        )
      }
    } catch (error) {
      console.error('Failed to update role:', error)
    } finally {
      setUpdating(null)
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
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {users.length} user{users.length !== 1 ? 's' : ''} registered
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">GHL Mappings</th>
              <th className="px-4 py-3 text-left font-medium">Contact Actions</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{user.name || 'Unknown'}</div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    disabled={updating === user.id}
                    className="h-8 w-28"
                  >
                    <option value="REP">Rep</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  {user.repLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.repLinks.map((link) => (
                        <Badge key={link.id} variant="secondary" className="text-xs">
                          {link.ghlUserId.slice(0, 8)}...
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user._count.contactStates.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
