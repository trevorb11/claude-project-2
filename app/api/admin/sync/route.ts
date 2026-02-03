import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { createGHLClient } from '@/lib/ghl'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { ghlUserId, ghlLocationId } = await request.json()

    const ghlClient = createGHLClient()
    if (!ghlClient) {
      return NextResponse.json(
        { error: 'GHL API not configured' },
        { status: 400 }
      )
    }

    // Create sync job
    const syncJob = await prisma.syncJob.create({
      data: {
        ghlLocationId: ghlLocationId || process.env.GHL_LOCATION_ID || '',
        ghlUserId: ghlUserId || null,
        status: 'RUNNING',
      },
    })

    try {
      // Fetch contacts from GHL
      const contacts = ghlUserId
        ? await ghlClient.getAllContactsForUser(ghlUserId)
        : []

      // Upsert contacts
      let syncedCount = 0
      for (const ghlContact of contacts) {
        await prisma.contact.upsert({
          where: { ghlContactId: ghlContact.id },
          update: {
            assignedTo: ghlContact.assignedTo,
            firstName: ghlContact.firstName,
            lastName: ghlContact.lastName,
            phone: ghlContact.phone,
            email: ghlContact.email,
            company: ghlContact.companyName,
            tags: ghlContact.tags || [],
            customFields: ghlContact.customFields,
            lastActivityAt: ghlContact.lastActivity
              ? new Date(ghlContact.lastActivity)
              : null,
            syncedAt: new Date(),
          },
          create: {
            ghlContactId: ghlContact.id,
            assignedTo: ghlContact.assignedTo,
            firstName: ghlContact.firstName,
            lastName: ghlContact.lastName,
            phone: ghlContact.phone,
            email: ghlContact.email,
            company: ghlContact.companyName,
            tags: ghlContact.tags || [],
            customFields: ghlContact.customFields,
            ghlCreatedAt: ghlContact.dateAdded
              ? new Date(ghlContact.dateAdded)
              : null,
            lastActivityAt: ghlContact.lastActivity
              ? new Date(ghlContact.lastActivity)
              : null,
          },
        })
        syncedCount++
      }

      // Update sync job
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'COMPLETED',
          contactsFound: contacts.length,
          contactsSynced: syncedCount,
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        syncJobId: syncJob.id,
        contactsFound: contacts.length,
        contactsSynced: syncedCount,
      })
    } catch (error) {
      // Update sync job with error
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      })

      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await requireAdmin()

    const jobs = await prisma.syncJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to get sync jobs' }, { status: 500 })
  }
}
