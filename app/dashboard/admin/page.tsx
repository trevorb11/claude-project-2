import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminTabs } from '@/components/admin-tabs'

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage users, rep mappings, and sync settings
        </p>
      </div>
      <AdminTabs />
    </div>
  )
}
