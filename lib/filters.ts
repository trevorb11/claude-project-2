import { z } from 'zod'

// Filter schema that the natural language parser outputs
export const ContactFilterSchema = z.object({
  text: z.string().optional(),
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
  dispositions: z.array(z.string()).optional(),
  excludeDispositions: z.array(z.string()).optional(),
  hasPhone: z.boolean().optional(),
  hasEmail: z.boolean().optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  lastActivityAfter: z.string().optional(),
  lastActivityBefore: z.string().optional(),
  callbackBefore: z.string().optional(),
  callbackAfter: z.string().optional(),
  excludedFromExport: z.boolean().optional(),
})

export type ContactFilter = z.infer<typeof ContactFilterSchema>

// Validate and sanitize filters
export function validateFilter(filter: unknown): ContactFilter {
  const result = ContactFilterSchema.safeParse(filter)
  if (!result.success) {
    throw new Error(`Invalid filter: ${result.error.message}`)
  }
  return result.data
}

// Ensure date strings are valid and within reasonable range
export function sanitizeDateRange(
  dateStr: string | undefined,
  maxDaysAgo: number = 365
): Date | undefined {
  if (!dateStr) return undefined

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return undefined

  const minDate = new Date()
  minDate.setDate(minDate.getDate() - maxDaysAgo)

  if (date < minDate) return minDate
  if (date > new Date()) return new Date()

  return date
}

// Natural language to filter conversion prompt
export const NL_TO_FILTER_PROMPT = `You are a filter parser for a contact management system. Convert the user's natural language query into a structured JSON filter.

Available filter fields:
- text: free text search (name, email, company)
- includeTags: array of tags contacts must have (e.g., ["CALL_READY", "HOT_LEAD"])
- excludeTags: array of tags to exclude (e.g., ["DNC", "UNSUBSCRIBED"])
- dispositions: array of dispositions to include (NOT_CALLED, CALLED, NO_ANSWER, LEFT_VOICEMAIL, SPOKE_WITH, BAD_NUMBER, FOLLOW_UP, NOT_INTERESTED, CONVERTED, DNC)
- excludeDispositions: array of dispositions to exclude
- hasPhone: boolean - filter to contacts with/without phone
- hasEmail: boolean - filter to contacts with/without email
- createdAfter: ISO date string (e.g., "2024-01-01")
- createdBefore: ISO date string
- lastActivityAfter: ISO date string
- lastActivityBefore: ISO date string
- callbackBefore: ISO date string - contacts with callbacks before this date
- callbackAfter: ISO date string
- excludedFromExport: boolean

Important rules:
1. Only output valid JSON, nothing else
2. Do not include fields that weren't mentioned
3. For relative dates like "last 7 days", calculate the actual date
4. Common tag mappings: "call ready" -> "CALL_READY", "do not call" -> "DNC", "hot" -> "HOT_LEAD"
5. If the query is unclear, be conservative and include fewer filters

Examples:
User: "call ready leads from last 7 days, exclude DNC"
Output: {"includeTags": ["CALL_READY"], "excludeTags": ["DNC"], "createdAfter": "2024-01-20"}

User: "contacts I haven't called yet with phone numbers"
Output: {"dispositions": ["NOT_CALLED"], "hasPhone": true}

User: "follow ups due today"
Output: {"dispositions": ["FOLLOW_UP"], "callbackBefore": "2024-01-27"}

User: "search roofing"
Output: {"text": "roofing"}

Today's date: {{DATE}}

User query: {{QUERY}}
Output:`

export function getNLToFilterPrompt(query: string): string {
  return NL_TO_FILTER_PROMPT
    .replace('{{DATE}}', new Date().toISOString().split('T')[0])
    .replace('{{QUERY}}', query)
}
