import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ExportHistory } from '@/components/export-history'

export default async function ExportsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const exports = await prisma.exportJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export History</h1>
        <p className="text-muted-foreground">
          View your recent contact exports
        </p>
      </div>
      <ExportHistory exports={exports} />
    </div>
  )
}
