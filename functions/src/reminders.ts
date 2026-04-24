import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { sendPushToTokens } from './lib/fcm'

const HOUR_MS = 60 * 60 * 1000

/**
 * Runs every 15 minutes. For each baby with reminderAfterHours set:
 *  - look at the most recent non-pump feeding
 *  - if it is older than reminderAfterHours AND we haven't sent a reminder
 *    within the last reminderAfterHours, push a notification to all members.
 */
export const remindersScheduled = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Europe/Berlin',
    memory: '256MiB',
  },
  async () => {
    const db = getFirestore()
    const now = Date.now()

    const babiesSnap = await db
      .collection('babies')
      .where('reminderAfterHours', '>', 0)
      .get()

    if (babiesSnap.empty) {
      logger.info('no babies with reminders')
      return
    }

    for (const babyDoc of babiesSnap.docs) {
      const baby = babyDoc.data() as {
        name: string
        memberIds: string[]
        reminderAfterHours: number
        lastReminderSentAt?: Timestamp | null
      }
      const babyId = babyDoc.id
      const hours = baby.reminderAfterHours
      if (!hours || !baby.memberIds?.length) continue

      // skip if we already sent a reminder within the last "hours" window
      const lastSentMs = baby.lastReminderSentAt?.toMillis() ?? 0
      if (now - lastSentMs < hours * HOUR_MS) {
        continue
      }

      // find latest non-pump feeding
      const recent = await db
        .collection('babies')
        .doc(babyId)
        .collection('feedings')
        .where('type', 'in', ['pre', 'milk', 'combo'])
        .orderBy('occurredAt', 'desc')
        .limit(1)
        .get()
      const last = recent.docs[0]?.data() as { occurredAt?: Timestamp } | undefined
      const lastMs = last?.occurredAt?.toMillis() ?? 0

      // if no feeding at all, skip (don't spam brand-new babies)
      if (!lastMs) continue

      const sinceMs = now - lastMs
      if (sinceMs < hours * HOUR_MS) continue

      // gather fcm tokens from member users
      const userSnaps = await Promise.all(
        baby.memberIds.map((uid) => db.doc(`users/${uid}`).get()),
      )
      const tokensByUser = new Map<string, string[]>()
      for (const snap of userSnaps) {
        const data = snap.data() as { fcmTokens?: string[] } | undefined
        const tokens = data?.fcmTokens ?? []
        if (tokens.length > 0) tokensByUser.set(snap.id, tokens)
      }

      if (tokensByUser.size === 0) {
        logger.info('no tokens registered', { babyId })
        continue
      }

      const hoursPretty = hours === 1 ? '1 Stunde' : `${hours} Stunden`
      await sendPushToTokens(tokensByUser, {
        babyId,
        title: `${baby.name}: Fütterung fällig`,
        body: `Letzte Mahlzeit liegt mehr als ${hoursPretty} zurück.`,
      })

      await babyDoc.ref.update({
        lastReminderSentAt: Timestamp.fromMillis(now),
      })

      logger.info('reminder sent', { babyId, tokenCount: Array.from(tokensByUser.values()).flat().length })
    }
  },
)
