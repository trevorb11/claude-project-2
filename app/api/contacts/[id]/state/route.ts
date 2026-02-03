import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const UpdateStateSchema = z.object({
  disposition: z.enum([
    'NOT_CALLED',
    'CALLED',
    'NO_ANSWER',
    'LEFT_VOICEMAIL',
    'SPOKE_WITH',
    'BAD_NUMBER',
    'FOLLOW_UP',
    'NOT_INTERESTED',
    'CONVERTED',
    'DNC',
  ]).optional(),
  note: z.string().optional(),
  callbackAt: z.string().nullable().optional(),
  excludedFromExport: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = UpdateStateSchema.parse(body)

    // Verify user has access to this contact
    const repLinks = await prisma.repLink.findMany({
      where: { userId: user.id },
    })
    const ghlUserIds = repLinks.map((link) => link.ghlUserId)

    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        assignedTo: { in: ghlUserIds },
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Upsert rep contact state
    const state = await prisma.repContactState.upsert({
      where: {
        userId_contactId: {
          userId: user.id,
          contactId: params.id,
        },
      },
      update: {
        ...(data.disposition && { disposition: data.disposition }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.callbackAt !== undefined && {
          callbackAt: data.callbackAt ? new Date(data.callbackAt) : null,
        }),
        ...(data.excludedFromExport !== undefined && {
          excludedFromExport: data.excludedFromExport,
        }),
      },
      create: {
        userId: user.id,
        contactId: params.id,
        disposition: data.disposition || 'NOT_CALLED',
        note: data.note,
        callbackAt: data.callbackAt ? new Date(data.callbackAt) : null,
        excludedFromExport: data.excludedFromExport || false,
      },
    })

    return NextResponse.json({ state })
  } catch (error) {
    console.error('Update state error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
