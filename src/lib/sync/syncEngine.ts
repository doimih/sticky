import { db } from '../db/appDb'
import { supabaseApi } from '../api/supabaseApi'
import { isSupabaseConfigured } from '../supabase/client'
import type { Connection, Note, Project, SyncQueueItem } from '../../types/domain'

let flushPromise: Promise<void> | null = null

export const enqueueSync = async (item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<void> => {
  await db.syncQueue.add({
    ...item,
    createdAt: new Date().toISOString(),
  })

  if (navigator.onLine && isSupabaseConfigured) {
    void flushSyncQueue()
  }
}

const processQueueItem = async (item: SyncQueueItem): Promise<void> => {
  if (item.entity === 'projects') {
    if (item.action === 'upsert') {
      await supabaseApi.upsertProject(item.payload as Project)
    } else if (item.action === 'delete') {
      await supabaseApi.deleteProject(String((item.payload as { id: string }).id))
    }
  }

  if (item.entity === 'notes') {
    if (item.action === 'upsert') {
      await supabaseApi.upsertNote(item.payload as Note)
    } else if (item.action === 'delete') {
      await supabaseApi.deleteNote(String((item.payload as { id: string }).id))
    }
  }

  if (item.entity === 'connections') {
    if (item.action === 'upsert') {
      await supabaseApi.upsertConnection(item.payload as Connection)
    } else if (item.action === 'delete') {
      await supabaseApi.deleteConnection(String((item.payload as { id: string }).id))
    }
  }
}

export const flushSyncQueue = async (): Promise<void> => {
  if (!navigator.onLine || !isSupabaseConfigured) return

  if (flushPromise) {
    await flushPromise
    return
  }

  flushPromise = (async () => {
    const items = await db.syncQueue.orderBy('createdAt').toArray()
    for (const item of items) {
      try {
        await processQueueItem(item)
        if (item.id) {
          await db.syncQueue.delete(item.id)
        }
      } catch (error) {
        console.error('[sync] Queue flush failed; will retry later.', {
          entity: item.entity,
          action: item.action,
          id: item.id,
          error,
        })
        break
      }
    }
  })()

  try {
    await flushPromise
  } finally {
    flushPromise = null
  }
}

export const setupAutoSync = (): (() => void) => {
  const handler = () => {
    void flushSyncQueue()
  }

  const visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      handler()
    }
  }

  window.addEventListener('online', handler)
  window.addEventListener('focus', handler)
  document.addEventListener('visibilitychange', visibilityHandler)
  void flushSyncQueue()

  return () => {
    window.removeEventListener('online', handler)
    window.removeEventListener('focus', handler)
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
}