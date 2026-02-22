import { create } from 'zustand'
import { db } from '../lib/db/appDb'
import { supabaseApi } from '../lib/api/supabaseApi'
import { enqueueSync } from '../lib/sync/syncEngine'
import type { Connection, Note } from '../types/domain'

interface BoardState {
  notes: Note[]
  connections: Connection[]
  searchQuery: string
  initBoard: (projectId: string) => Promise<void>
  hydrateBoardFromRemote: (projectId: string) => Promise<void>
  upsertNoteFromRemote: (note: Note) => Promise<void>
  deleteNoteFromRemote: (noteId: string) => Promise<void>
  upsertConnectionFromRemote: (connection: Connection) => Promise<void>
  deleteConnectionFromRemote: (connectionId: string) => Promise<void>
  setSearchQuery: (query: string) => void
  createNote: (projectId: string, userId: string) => Promise<void>
  updateNotePosition: (noteId: string, x: number, y: number) => Promise<void>
  updateNoteContent: (noteId: string, patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'color'>>) => Promise<void>
  deleteNote: (noteId: string) => Promise<void>
  createConnection: (projectId: string, noteIdFrom: string, noteIdTo: string) => Promise<void>
  deleteConnection: (connectionId: string) => Promise<void>
}

const nowIso = () => new Date().toISOString()

export const useBoardStore = create<BoardState>((set, get) => ({
  notes: [],
  connections: [],
  searchQuery: '',

  initBoard: async (projectId) => {
    const [notes, connections] = await Promise.all([
      db.notes.where('projectId').equals(projectId).toArray(),
      db.connections.where('projectId').equals(projectId).toArray(),
    ])

    set({ notes, connections })
  },

  hydrateBoardFromRemote: async (projectId) => {
    if (!navigator.onLine) return

    const [remoteNotes, remoteConnections] = await Promise.all([
      supabaseApi.fetchNotes(projectId),
      supabaseApi.fetchConnections(projectId),
    ])

    const localNotes = await db.notes.where('projectId').equals(projectId).toArray()
    const localById = new Map(localNotes.map((item) => [item.id, item]))

    for (const remoteNote of remoteNotes) {
      const localNote = localById.get(remoteNote.id)
      if (!localNote || new Date(remoteNote.updatedAt).getTime() >= new Date(localNote.updatedAt).getTime()) {
        await db.notes.put(remoteNote)
      }
    }

    await db.connections.bulkPut(remoteConnections)
    await get().initBoard(projectId)
  },

  upsertNoteFromRemote: async (note) => {
    const local = await db.notes.get(note.id)
    if (!local || new Date(note.updatedAt).getTime() >= new Date(local.updatedAt).getTime()) {
      await db.notes.put(note)
    }

    set((state) => {
      const found = state.notes.some((item) => item.id === note.id)
      return {
        notes: found ? state.notes.map((item) => (item.id === note.id ? note : item)) : [note, ...state.notes],
      }
    })
  },

  deleteNoteFromRemote: async (noteId) => {
    await db.notes.delete(noteId)
    set((state) => ({
      notes: state.notes.filter((item) => item.id !== noteId),
      connections: state.connections.filter((item) => item.noteIdFrom !== noteId && item.noteIdTo !== noteId),
    }))
  },

  upsertConnectionFromRemote: async (connection) => {
    await db.connections.put(connection)
    set((state) => {
      const found = state.connections.some((item) => item.id === connection.id)
      return {
        connections: found
          ? state.connections.map((item) => (item.id === connection.id ? connection : item))
          : [...state.connections, connection],
      }
    })
  },

  deleteConnectionFromRemote: async (connectionId) => {
    await db.connections.delete(connectionId)
    set((state) => ({
      connections: state.connections.filter((item) => item.id !== connectionId),
    }))
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  createNote: async (projectId, userId) => {
    const noteIndex = get().notes.length
    const offset = (noteIndex % 8) * 26

    const note: Note = {
      id: crypto.randomUUID(),
      projectId,
      userId,
      title: `Untitled ${noteIndex + 1}`,
      content: '',
      tags: [],
      posX: 120 + offset,
      posY: 120 + offset,
      width: 240,
      height: 160,
      color: '#fef08a',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    await db.notes.put(note)
    await enqueueSync({ entity: 'notes', action: 'upsert', payload: note })
    set((state) => ({ notes: [note, ...state.notes] }))
  },

  updateNotePosition: async (noteId, x, y) => {
    const note = get().notes.find((item) => item.id === noteId)
    if (!note) return

    const next: Note = { ...note, posX: x, posY: y, updatedAt: nowIso() }
    await db.notes.put(next)
    await enqueueSync({ entity: 'notes', action: 'upsert', payload: next })

    set((state) => ({
      notes: state.notes.map((item) => (item.id === noteId ? next : item)),
    }))
  },

  updateNoteContent: async (noteId, patch) => {
    const note = get().notes.find((item) => item.id === noteId)
    if (!note) return

    const next: Note = { ...note, ...patch, updatedAt: nowIso() }
    await db.notes.put(next)
    await enqueueSync({ entity: 'notes', action: 'upsert', payload: next })

    set((state) => ({
      notes: state.notes.map((item) => (item.id === noteId ? next : item)),
    }))
  },

  deleteNote: async (noteId) => {
    await db.notes.delete(noteId)
    await db.connections.where('noteIdFrom').equals(noteId).delete()
    await db.connections.where('noteIdTo').equals(noteId).delete()
    await enqueueSync({ entity: 'notes', action: 'delete', payload: { id: noteId } })

    set((state) => ({
      notes: state.notes.filter((item) => item.id !== noteId),
      connections: state.connections.filter((item) => item.noteIdFrom !== noteId && item.noteIdTo !== noteId),
    }))
  },

  createConnection: async (projectId, noteIdFrom, noteIdTo) => {
    const exists = get().connections.some((c) => c.noteIdFrom === noteIdFrom && c.noteIdTo === noteIdTo)
    if (exists || noteIdFrom === noteIdTo) return

    const connection: Connection = {
      id: crypto.randomUUID(),
      projectId,
      noteIdFrom,
      noteIdTo,
      type: 'arrow',
      createdAt: nowIso(),
    }

    await db.connections.put(connection)
    await enqueueSync({ entity: 'connections', action: 'upsert', payload: connection })
    set((state) => ({ connections: [...state.connections, connection] }))
  },

  deleteConnection: async (connectionId) => {
    await db.connections.delete(connectionId)
    await enqueueSync({ entity: 'connections', action: 'delete', payload: { id: connectionId } })
    set((state) => ({
      connections: state.connections.filter((item) => item.id !== connectionId),
    }))
  },
}))