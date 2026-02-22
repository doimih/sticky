import { db } from '../db/appDb'
import { supabaseApi } from '../api/supabaseApi'
import type { Connection, Note, Project, SyncQueueItem } from '../../types/domain'

export const enqueueSync = async (item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<void> => {
  await db.syncQueue.add({
    ...item,
    createdAt: new Date().toISOString(),
  })
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
  if (!navigator.onLine) return

  const items = await db.syncQueue.orderBy('createdAt').toArray()
  for (const item of items) {
    try {
      await processQueueItem(item)
      if (item.id) {
        await db.syncQueue.delete(item.id)
      }
    } catch {
      break
    }
  }
}

export const setupAutoSync = (): (() => void) => {
  const handler = () => {
    void flushSyncQueue()
  }

  window.addEventListener('online', handler)
  void flushSyncQueue()

  return () => window.removeEventListener('online', handler)
}