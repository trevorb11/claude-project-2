import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const BulkUpdateSchema = z.object({
  contactIds: z.array(z.string()).min(1).max(500),
  action: z.enum(['setDisposition', 'setCallback', 'setExcluded', 'clearCallback']),
  value: z.any().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contactIds, action, value } = BulkUpdateSchema.parse(body)

    // Verify user has access to these contacts
    const repLinks = await prisma.repLink.findMany({
      where: { userId: user.id },
    })
    const ghlUserIds = repLinks.map((link) => link.ghlUserId)

    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        assignedTo: { in: ghlUserIds },
      },
      select: { id: true },
    })

    const validContactIds = contacts.map((c) => c.id)

    if (validContactIds.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found' }, { status: 400 })
    }

    // Build update data based on action
    let updateData: any = {}

    switch (action) {
      case 'setDisposition':
        if (!value || typeof value !== 'string') {
          return NextResponse.json({ error: 'Invalid disposition value' }, { status: 400 })
        }
        updateData = { disposition: value }
        break

      case 'setCallback':
        if (!value || typeof value !== 'string') {
          return NextResponse.json({ error: 'Invalid callback value' }, { status: 400 })
        }
        updateData = { callbackAt: new Date(value) }
        break

      case 'clearCallback':
        updateData = { callbackAt: null }
        break

      case 'setExcluded':
        if (typeof value !== 'boolean') {
          return NextResponse.json({ error: 'Invalid excluded value' }, { status: 400 })
        }
        updateData = { excludedFromExport: value }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Upsert states for all contacts
    const results = await Promise.all(
      validContactIds.map((contactId) =>
        prisma.repContactState.upsert({
          where: {
            userId_contactId: {
              userId: user.id,
              contactId,
            },
          },
          update: updateData,
          create: {
            userId: user.id,
            contactId,
            ...updateData,
          },
        })
      )
    )

    return NextResponse.json({
      updated: results.length,
      total: contactIds.length,
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk update failed' },
      { status: 500 }
    )
  }
}
