import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { validateFilter, type ContactFilter } from '@/lib/filters'
import { toE164 } from '@/lib/utils'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filter, selectedIds } = body

    // Validate filter if provided
    let validatedFilter: ContactFilter = {}
    if (filter) {
      validatedFilter = validateFilter(filter)
    }

    // Get rep's GHL user IDs
    const repLinks = await prisma.repLink.findMany({
      where: { userId: user.id },
    })
    const ghlUserIds = repLinks.map((link) => link.ghlUserId)

    if (ghlUserIds.length === 0) {
      return NextResponse.json({ error: 'No linked accounts' }, { status: 400 })
    }

    // Build WHERE clause
    const where: Prisma.ContactWhereInput = {
      assignedTo: { in: ghlUserIds },
    }

    // If specific IDs selected, use those
    if (selectedIds?.length) {
      where.id = { in: selectedIds }
    }

    // Apply filters
    if (validatedFilter.text) {
      where.OR = [
        { firstName: { contains: validatedFilter.text, mode: 'insensitive' } },
        { lastName: { contains: validatedFilter.text, mode: 'insensitive' } },
        { email: { contains: validatedFilter.text, mode: 'insensitive' } },
        { company: { contains: validatedFilter.text, mode: 'insensitive' } },
      ]
    }

    if (validatedFilter.includeTags?.length) {
      where.tags = { hasEvery: validatedFilter.includeTags }
    }

    if (validatedFilter.hasPhone === true) {
      where.phone = { not: null }
    }

    // Get contacts with rep state, excluding those marked as excluded
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        repStates: {
          where: { userId: user.id },
          take: 1,
        },
      },
      take: 25000, // Hard cap
    })

    // Filter out excluded contacts
    const exportContacts = contacts.filter(
      (c) => !c.repStates[0]?.excludedFromExport
    )

    if (exportContacts.length === 0) {
      return NextResponse.json({ error: 'No contacts to export' }, { status: 400 })
    }

    // Generate CSV
    const headers = [
      'Phone',
      'First Name',
      'Last Name',
      'Company',
      'Email',
      'Contact ID',
      'Tags',
      'Disposition',
      'Callback At',
    ]

    const rows = exportContacts.map((contact) => [
      toE164(contact.phone),
      contact.firstName || '',
      contact.lastName || '',
      contact.company || '',
      contact.email || '',
      contact.ghlContactId,
      (contact.tags || []).join('|'),
      contact.repStates[0]?.disposition || 'NOT_CALLED',
      contact.repStates[0]?.callbackAt?.toISOString() || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          // Escape cells with commas or quotes
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        }).join(',')
      ),
    ].join('\n')

    // Create export job record
    await prisma.exportJob.create({
      data: {
        userId: user.id,
        status: 'COMPLETED',
        filterJson: validatedFilter,
        totalCount: exportContacts.length,
        fileName: `contacts-export-${new Date().toISOString().split('T')[0]}.csv`,
        completedAt: new Date(),
      },
    })

    // Return CSV as download
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
