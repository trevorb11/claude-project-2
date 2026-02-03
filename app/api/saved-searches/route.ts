import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { validateFilter } from '@/lib/filters'
import { z } from 'zod'

const CreateSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filter: z.any(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searches = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ searches })
  } catch (error) {
    console.error('Get searches error:', error)
    return NextResponse.json(
      { error: 'Failed to get searches' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, filter } = CreateSearchSchema.parse(body)

    // Validate filter
    const validatedFilter = validateFilter(filter)

    const search = await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name,
        filterJson: validatedFilter,
      },
    })

    return NextResponse.json({ search })
  } catch (error) {
    console.error('Create search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save search' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Search ID required' }, { status: 400 })
    }

    await prisma.savedSearch.deleteMany({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete search error:', error)
    return NextResponse.json(
      { error: 'Failed to delete search' },
      { status: 500 }
    )
  }
}
