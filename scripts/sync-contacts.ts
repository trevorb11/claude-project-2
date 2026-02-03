/**
 * Nightly Contact Sync Script
 *
 * This script syncs contacts from GoHighLevel for all configured rep mappings.
 * Run with: npm run sync:contacts
 *
 * For Replit Scheduled Deployments, set up a cron to run this script nightly.
 */

import { PrismaClient } from '@prisma/client'
import { GHLClient } from '../lib/ghl'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting nightly contact sync...')
  console.log(`Time: ${new Date().toISOString()}`)

  const apiKey = process.env.GHL_API_KEY
  const locationId = process.env.GHL_LOCATION_ID

  if (!apiKey || !locationId) {
    console.error('GHL_API_KEY and GHL_LOCATION_ID must be set')
    process.exit(1)
  }

  const ghlClient = new GHLClient(apiKey, locationId)

  // Get all unique GHL user IDs from rep links
  const repLinks = await prisma.repLink.findMany({
    distinct: ['ghlUserId'],
  })

  console.log(`Found ${repLinks.length} unique GHL users to sync`)

  for (const link of repLinks) {
    console.log(`\nSyncing contacts for GHL user: ${link.ghlUserId}`)

    // Create sync job
    const syncJob = await prisma.syncJob.create({
      data: {
        ghlLocationId: locationId,
        ghlUserId: link.ghlUserId,
        status: 'RUNNING',
      },
    })

    try {
      // Fetch all contacts for this user
      const contacts = await ghlClient.getAllContactsForUser(
        link.ghlUserId,
        (count) => {
          if (count % 100 === 0) {
            console.log(`  Fetched ${count} contacts...`)
          }
        }
      )

      console.log(`  Found ${contacts.length} contacts`)

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

        if (syncedCount % 100 === 0) {
          console.log(`  Synced ${syncedCount} contacts...`)
        }
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

      console.log(`  Completed: ${syncedCount} contacts synced`)
    } catch (error) {
      console.error(`  Error syncing user ${link.ghlUserId}:`, error)

      // Update sync job with error
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      })
    }
  }

  // Clean up old contacts that haven't been synced in 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const staleContacts = await prisma.contact.deleteMany({
    where: {
      syncedAt: { lt: thirtyDaysAgo },
    },
  })

  if (staleContacts.count > 0) {
    console.log(`\nCleaned up ${staleContacts.count} stale contacts`)
  }

  console.log('\nSync completed!')
}

main()
  .catch((error) => {
    console.error('Sync failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
