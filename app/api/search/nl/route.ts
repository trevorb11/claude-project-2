import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getNLToFilterPrompt, validateFilter } from '@/lib/filters'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      // Fallback to simple text search
      return NextResponse.json({
        filter: { text: query },
        explanation: 'Natural language search not configured. Using text search.',
      })
    }

    const prompt = getNLToFilterPrompt(query)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return NextResponse.json({
        filter: { text: query },
        explanation: 'Could not parse query. Using text search.',
      })
    }

    // Parse and validate the filter
    try {
      const parsedFilter = JSON.parse(content)
      const validatedFilter = validateFilter(parsedFilter)

      return NextResponse.json({
        filter: validatedFilter,
        explanation: `Searching for: ${Object.entries(validatedFilter)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(', ')}`,
      })
    } catch {
      return NextResponse.json({
        filter: { text: query },
        explanation: 'Could not parse query. Using text search.',
      })
    }
  } catch (error) {
    console.error('NL search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
