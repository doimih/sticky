import Dexie, { type EntityTable } from 'dexie'
import type { Attachment, Connection, Note, Project, SyncQueueItem } from '../../types/domain'

export class AppDb extends Dexie {
  projects!: EntityTable<Project, 'id'>
  notes!: EntityTable<Note, 'id'>
  connections!: EntityTable<Connection, 'id'>
  attachments!: EntityTable<Attachment, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('sticky-db')
    this.version(1).stores({
      projects: '&id, userId, createdAt',
      notes: '&id, projectId, userId, updatedAt, [projectId+updatedAt]',
      connections: '&id, projectId, noteIdFrom, noteIdTo',
      attachments: '&id, noteId, createdAt',
      syncQueue: '++id, entity, action, createdAt',
    })
  }
}

export const db = new AppDb()