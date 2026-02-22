import { useEffect } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { useBoardStore } from '../store/useBoardStore'
import { setupAutoSync } from '../lib/sync/syncEngine'
import { useAuthStore } from '../store/useAuthStore'

export const useBoardBootstrap = (): { userId: string | null; loading: boolean } => {
  const initAuth = useAuthStore((state) => state.init)
  const session = useAuthStore((state) => state.session)
  const loading = useAuthStore((state) => state.loading)

  const initProjects = useProjectStore((state) => state.initProjects)
  const hydrateProjectsFromRemote = useProjectStore((state) => state.hydrateProjectsFromRemote)
  const createProject = useProjectStore((state) => state.createProject)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const projects = useProjectStore((state) => state.projects)
  const initBoard = useBoardStore((state) => state.initBoard)
  const hydrateBoardFromRemote = useBoardStore((state) => state.hydrateBoardFromRemote)

  const userId = session?.user?.id ?? null

  useEffect(() => {
    void initAuth()
  }, [initAuth])

  useEffect(() => {
    if (!userId) return

    const run = async () => {
      await initProjects(userId)
      await hydrateProjectsFromRemote(userId)
      const hasProjects = useProjectStore.getState().projects.length > 0

      if (!hasProjects) {
        await createProject('My First Board', userId)
      }
    }

    void run()
  }, [createProject, hydrateProjectsFromRemote, initProjects, userId])

  useEffect(() => {
    if (!activeProjectId) return
    void initBoard(activeProjectId)
    void hydrateBoardFromRemote(activeProjectId)
  }, [activeProjectId, hydrateBoardFromRemote, initBoard])

  useEffect(() => setupAutoSync(), [])

  useEffect(() => {
    if (projects.length === 0) return
    if (!activeProjectId) {
      useProjectStore.getState().setActiveProject(projects[0].id)
    }
  }, [activeProjectId, projects])

  return { userId, loading }
}