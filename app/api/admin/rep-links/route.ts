import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

const CreateRepLinkSchema = z.object({
  userId: z.string(),
  ghlLocationId: z.string(),
  ghlUserId: z.string(),
})

export async function GET() {
  try {
    await requireAdmin()

    const repLinks = await prisma.repLink.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ repLinks })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to get rep links' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { userId, ghlLocationId, ghlUserId } = CreateRepLinkSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or update rep link
    const repLink = await prisma.repLink.upsert({
      where: {
        userId_ghlLocationId: { userId, ghlLocationId },
      },
      update: { ghlUserId },
      create: { userId, ghlLocationId, ghlUserId },
    })

    return NextResponse.json({ repLink })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Create rep link error:', error)
    return NextResponse.json({ error: 'Failed to create rep link' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Rep link ID required' }, { status: 400 })
    }

    await prisma.repLink.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to delete rep link' }, { status: 500 })
  }
}
