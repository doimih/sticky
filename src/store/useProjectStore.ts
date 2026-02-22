import { create } from 'zustand'
import { db } from '../lib/db/appDb'
import { supabaseApi } from '../lib/api/supabaseApi'
import { enqueueSync } from '../lib/sync/syncEngine'
import type { Project } from '../types/domain'

interface ProjectState {
  projects: Project[]
  activeProjectId: string | null
  initProjects: (userId: string) => Promise<void>
  hydrateProjectsFromRemote: (userId: string) => Promise<void>
  createProject: (name: string, userId: string) => Promise<void>
  upsertProjectFromRemote: (project: Project) => Promise<void>
  deleteProjectFromRemote: (projectId: string) => Promise<void>
  setActiveProject: (projectId: string) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,

  initProjects: async (userId) => {
    const projects = await db.projects.where('userId').equals(userId).sortBy('createdAt')
    set({
      projects,
      activeProjectId: get().activeProjectId ?? projects[0]?.id ?? null,
    })
  },

  hydrateProjectsFromRemote: async (userId) => {
    if (!navigator.onLine) return
    const remoteProjects = await supabaseApi.fetchProjects(userId)
    await db.projects.bulkPut(remoteProjects)
    const projects = await db.projects.where('userId').equals(userId).sortBy('createdAt')
    set((state) => ({
      projects,
      activeProjectId: state.activeProjectId ?? projects[0]?.id ?? null,
    }))
  },

  createProject: async (name, userId) => {
    const project: Project = {
      id: crypto.randomUUID(),
      userId,
      name,
      createdAt: new Date().toISOString(),
    }

    await db.projects.put(project)
    await enqueueSync({ entity: 'projects', action: 'upsert', payload: project })
    set((state) => ({
      projects: [...state.projects, project],
      activeProjectId: project.id,
    }))
  },

  upsertProjectFromRemote: async (project) => {
    await db.projects.put(project)
    set((state) => {
      const found = state.projects.some((item) => item.id === project.id)
      return {
        projects: found ? state.projects.map((item) => (item.id === project.id ? project : item)) : [...state.projects, project],
      }
    })
  },

  deleteProjectFromRemote: async (projectId) => {
    await db.projects.delete(projectId)
    set((state) => ({
      projects: state.projects.filter((item) => item.id !== projectId),
      activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
    }))
  },

  setActiveProject: (projectId) => {
    set({ activeProjectId: projectId })
  },
}))