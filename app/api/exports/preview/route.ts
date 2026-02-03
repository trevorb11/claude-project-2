import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { validateFilter, type ContactFilter } from '@/lib/filters'
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
      return NextResponse.json({ count: 0, hasPhone: 0 })
    }

    // Build WHERE clause
    const where: Prisma.ContactWhereInput = {
      assignedTo: { in: ghlUserIds },
    }

    if (selectedIds?.length) {
      where.id = { in: selectedIds }
    }

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

    // Get counts
    const [totalCount, withPhoneCount] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.count({
        where: { ...where, phone: { not: null } },
      }),
    ])

    // Get count excluding "excluded" contacts
    const excludedCount = await prisma.repContactState.count({
      where: {
        userId: user.id,
        excludedFromExport: true,
        contact: where,
      },
    })

    return NextResponse.json({
      count: Math.min(totalCount - excludedCount, 25000),
      hasPhone: withPhoneCount,
      excluded: excludedCount,
      maxExport: 25000,
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview failed' },
      { status: 500 }
    )
  }
}
