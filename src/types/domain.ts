export type ID = string

export interface Project {
  id: ID
  userId: ID
  name: string
  createdAt: string
}

export interface UserProfile {
  id: ID
  email: string
  role: 'user' | 'superadmin'
  createdAt: string
}

export interface Note {
  id: ID
  projectId: ID
  userId: ID
  title: string
  content: string
  tags: string[]
  posX: number
  posY: number
  width: number
  height: number
  color: string
  createdAt: string
  updatedAt: string
}

export interface Connection {
  id: ID
  projectId: ID
  noteIdFrom: ID
  noteIdTo: ID
  type: 'line' | 'arrow'
  createdAt: string
}

export interface Attachment {
  id: ID
  noteId: ID
  fileUrl: string
  type: 'image' | 'link'
  createdAt: string
}

export interface SyncQueueItem {
  id?: number
  entity: 'projects' | 'notes' | 'connections' | 'attachments'
  action: 'upsert' | 'delete'
  payload: unknown
  createdAt: string
}