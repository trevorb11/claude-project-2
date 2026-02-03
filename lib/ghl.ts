import { delay } from './utils'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'

interface GHLContact {
  id: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  companyName?: string
  tags?: string[]
  customFields?: Record<string, any>[]
  assignedTo?: string
  dateAdded?: string
  dateUpdated?: string
  lastActivity?: string
}

interface GHLSearchResponse {
  contacts: GHLContact[]
  meta: {
    total: number
    nextPageUrl?: string
    startAfterId?: string
    startAfter?: number
  }
}

export class GHLClient {
  private apiKey: string
  private locationId: string

  constructor(apiKey: string, locationId: string) {
    this.apiKey = apiKey
    this.locationId = locationId
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GHL_API_BASE}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GHL API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async searchContacts(params: {
    assignedTo?: string
    query?: string
    limit?: number
    startAfterId?: string
  }): Promise<GHLSearchResponse> {
    const searchParams = new URLSearchParams()
    searchParams.set('locationId', this.locationId)

    if (params.limit) {
      searchParams.set('limit', params.limit.toString())
    }
    if (params.startAfterId) {
      searchParams.set('startAfterId', params.startAfterId)
    }
    if (params.query) {
      searchParams.set('query', params.query)
    }

    return this.request<GHLSearchResponse>(
      `/contacts/?${searchParams.toString()}`
    )
  }

  async getContact(contactId: string): Promise<{ contact: GHLContact }> {
    return this.request<{ contact: GHLContact }>(
      `/contacts/${contactId}`
    )
  }

  async getAllContactsForUser(
    ghlUserId: string,
    onProgress?: (count: number) => void
  ): Promise<GHLContact[]> {
    const allContacts: GHLContact[] = []
    let startAfterId: string | undefined
    let hasMore = true
    const limit = 100

    while (hasMore) {
      const response = await this.searchContacts({
        assignedTo: ghlUserId,
        limit,
        startAfterId,
      })

      // Filter to only contacts assigned to this user
      const userContacts = response.contacts.filter(
        (c) => c.assignedTo === ghlUserId
      )

      allContacts.push(...userContacts)

      if (onProgress) {
        onProgress(allContacts.length)
      }

      // Check if there are more pages
      if (response.contacts.length < limit || !response.meta.startAfterId) {
        hasMore = false
      } else {
        startAfterId = response.meta.startAfterId
        // Rate limiting
        await delay(200)
      }
    }

    return allContacts
  }
}

export function createGHLClient(): GHLClient | null {
  const apiKey = process.env.GHL_API_KEY
  const locationId = process.env.GHL_LOCATION_ID

  if (!apiKey || !locationId) {
    return null
  }

  return new GHLClient(apiKey, locationId)
}
