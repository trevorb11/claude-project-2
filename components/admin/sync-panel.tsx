'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface SyncJob {
  id: string
  ghlLocationId: string
  ghlUserId: string | null
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  contactsFound: number
  contactsSynced: number
  error: string | null
  startedAt: string
  completedAt: string | null
}

export function SyncPanel() {
  const [jobs, setJobs] = useState<SyncJob[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [ghlUserId, setGhlUserId] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/sync')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs)
      }
    } catch (error) {
      console.error('Failed to fetch sync jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghlUserId: ghlUserId || undefined,
        }),
      })

      if (response.ok) {
        await fetchJobs()
        setGhlUserId('')
      } else {
        const data = await response.json()
        alert(data.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusBadge = (status: SyncJob['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'RUNNING':
        return (
          <Badge className="gap-1 bg-blue-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Manual Sync */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium mb-4">Manual Sync</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground">
              GHL User ID (optional - leave blank to sync all)
            </label>
            <Input
              value={ghlUserId}
              onChange={(e) => setGhlUserId(e.target.value)}
              placeholder="user_xyz789..."
              className="mt-1"
            />
          </div>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Sync
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          This will fetch contacts from GoHighLevel and sync them to the local database.
          Make sure GHL API credentials are configured in environment variables.
        </p>
      </div>

      {/* Sync History */}
      <div className="text-sm text-muted-foreground">
        Recent sync jobs
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">GHL User</th>
              <th className="px-4 py-3 text-left font-medium">Contacts</th>
              <th className="px-4 py-3 text-left font-medium">Started</th>
              <th className="px-4 py-3 text-left font-medium">Completed</th>
              <th className="px-4 py-3 text-left font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No sync jobs yet
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-t">
                  <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {job.ghlUserId || 'All users'}
                  </td>
                  <td className="px-4 py-3">
                    {job.contactsSynced.toLocaleString()} / {job.contactsFound.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(job.startedAt), 'MMM d, h:mm a')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {job.completedAt
                      ? format(new Date(job.completedAt), 'MMM d, h:mm a')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {job.error && (
                      <span className="text-red-500 text-xs" title={job.error}>
                        {job.error.slice(0, 50)}...
                      </span>
                    )}
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
