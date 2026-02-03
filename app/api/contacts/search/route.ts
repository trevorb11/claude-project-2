import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { validateFilter, sanitizeDateRange, type ContactFilter } from '@/lib/filters'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filter, page = 1, pageSize = 50, sortBy = 'createdAt', sortOrder = 'desc' } = body

    // Validate and sanitize filter
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
      return NextResponse.json({
        contacts: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      })
    }

    // Build WHERE clause - always filter by assigned user (security!)
    const where: Prisma.ContactWhereInput = {
      assignedTo: { in: ghlUserIds },
    }

    // Apply text search
    if (validatedFilter.text) {
      where.OR = [
        { firstName: { contains: validatedFilter.text, mode: 'insensitive' } },
        { lastName: { contains: validatedFilter.text, mode: 'insensitive' } },
        { email: { contains: validatedFilter.text, mode: 'insensitive' } },
        { company: { contains: validatedFilter.text, mode: 'insensitive' } },
      ]
    }

    // Apply tag filters
    if (validatedFilter.includeTags?.length) {
      where.tags = { hasEvery: validatedFilter.includeTags }
    }
    if (validatedFilter.excludeTags?.length) {
      where.NOT = {
        tags: { hasSome: validatedFilter.excludeTags },
      }
    }

    // Apply phone/email filters
    if (validatedFilter.hasPhone === true) {
      where.phone = { not: null }
    } else if (validatedFilter.hasPhone === false) {
      where.phone = null
    }

    if (validatedFilter.hasEmail === true) {
      where.email = { not: null }
    } else if (validatedFilter.hasEmail === false) {
      where.email = null
    }

    // Apply date filters
    if (validatedFilter.createdAfter) {
      const date = sanitizeDateRange(validatedFilter.createdAfter)
      if (date) {
        where.createdAt = { ...(where.createdAt as any), gte: date }
      }
    }
    if (validatedFilter.createdBefore) {
      const date = sanitizeDateRange(validatedFilter.createdBefore)
      if (date) {
        where.createdAt = { ...(where.createdAt as any), lte: date }
      }
    }
    if (validatedFilter.lastActivityAfter) {
      const date = sanitizeDateRange(validatedFilter.lastActivityAfter)
      if (date) {
        where.lastActivityAt = { ...(where.lastActivityAt as any), gte: date }
      }
    }
    if (validatedFilter.lastActivityBefore) {
      const date = sanitizeDateRange(validatedFilter.lastActivityBefore)
      if (date) {
        where.lastActivityAt = { ...(where.lastActivityAt as any), lte: date }
      }
    }

    // Get total count
    const total = await prisma.contact.count({ where })

    // Apply pagination limits (hard cap at 25k)
    const effectivePageSize = Math.min(pageSize, 100)
    const maxResults = 25000
    const totalPages = Math.min(Math.ceil(total / effectivePageSize), Math.ceil(maxResults / effectivePageSize))
    const effectivePage = Math.min(page, totalPages) || 1

    // Fetch contacts with rep state
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        repStates: {
          where: { userId: user.id },
          take: 1,
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (effectivePage - 1) * effectivePageSize,
      take: effectivePageSize,
    })

    // Transform response
    const transformedContacts = contacts.map((contact) => ({
      id: contact.id,
      ghlContactId: contact.ghlContactId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      email: contact.email,
      company: contact.company,
      tags: contact.tags,
      createdAt: contact.createdAt,
      lastActivityAt: contact.lastActivityAt,
      // Rep-specific state
      disposition: contact.repStates[0]?.disposition || 'NOT_CALLED',
      note: contact.repStates[0]?.note || null,
      callbackAt: contact.repStates[0]?.callbackAt || null,
      excludedFromExport: contact.repStates[0]?.excludedFromExport || false,
    }))

    return NextResponse.json({
      contacts: transformedContacts,
      total: Math.min(total, maxResults),
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages,
    })
  } catch (error) {
    console.error('Contact search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
