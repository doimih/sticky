import { supabase } from '../supabase/client'
import type { Connection, Note, Project } from '../../types/domain'

export const projectFromRow = (row: any): Project => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  createdAt: row.created_at,
})

const projectToRow = (project: Project) => ({
  id: project.id,
  user_id: project.userId,
  name: project.name,
  created_at: project.createdAt,
})

export const noteFromRow = (row: any): Note => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  title: row.title,
  content: row.content,
  tags: row.tags ?? [],
  posX: row.pos_x,
  posY: row.pos_y,
  width: row.width,
  height: row.height,
  color: row.color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const noteToRow = (note: Note) => ({
  id: note.id,
  project_id: note.projectId,
  user_id: note.userId,
  title: note.title,
  content: note.content,
  tags: note.tags,
  pos_x: note.posX,
  pos_y: note.posY,
  width: note.width,
  height: note.height,
  color: note.color,
  created_at: note.createdAt,
  updated_at: note.updatedAt,
})

export const connectionFromRow = (row: any): Connection => ({
  id: row.id,
  projectId: row.project_id,
  noteIdFrom: row.note_id_from,
  noteIdTo: row.note_id_to,
  type: row.type,
  createdAt: row.created_at,
})

const connectionToRow = (connection: Connection) => ({
  id: connection.id,
  project_id: connection.projectId,
  note_id_from: connection.noteIdFrom,
  note_id_to: connection.noteIdTo,
  type: connection.type,
  created_at: connection.createdAt,
})

export const supabaseApi = {
  async fetchProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at')
    if (error) throw error
    return (data ?? []).map(projectFromRow)
  },

  async fetchNotes(projectId: string): Promise<Note[]> {
    const { data, error } = await supabase.from('notes').select('*').eq('project_id', projectId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(noteFromRow)
  },

  async fetchConnections(projectId: string): Promise<Connection[]> {
    const { data, error } = await supabase.from('connections').select('*').eq('project_id', projectId)
    if (error) throw error
    return (data ?? []).map(connectionFromRow)
  },

  async upsertProject(project: Project): Promise<void> {
    const { error } = await supabase.from('projects').upsert(projectToRow(project))
    if (error) throw error
  },

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) throw error
  },

  async upsertNote(note: Note): Promise<void> {
    const { error } = await supabase.from('notes').upsert(noteToRow(note))
    if (error) throw error
  },

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase.from('notes').delete().eq('id', noteId)
    if (error) throw error
  },

  async upsertConnection(connection: Connection): Promise<void> {
    const { error } = await supabase.from('connections').upsert(connectionToRow(connection))
    if (error) throw error
  },

  async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await supabase.from('connections').delete().eq('id', connectionId)
    if (error) throw error
  },
}