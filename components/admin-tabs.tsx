'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { UsersPanel } from './admin/users-panel'
import { RepLinksPanel } from './admin/rep-links-panel'
import { SyncPanel } from './admin/sync-panel'
import { Users, Link, RefreshCw } from 'lucide-react'

const tabs = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'rep-links', label: 'Rep Mappings', icon: Link },
  { id: 'sync', label: 'Sync Jobs', icon: RefreshCw },
]

export function AdminTabs() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div>
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'rep-links' && <RepLinksPanel />}
        {activeTab === 'sync' && <SyncPanel />}
      </div>
    </div>
  )
}
