import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'
import { connectionFromRow, noteFromRow, projectFromRow } from '../lib/api/supabaseApi'
import { useBoardStore } from '../store/useBoardStore'
import { useProjectStore } from '../store/useProjectStore'

interface UseRealtimeSyncParams {
  userId: string | null
  projectId: string | null
}

export const useRealtimeSync = ({ userId, projectId }: UseRealtimeSyncParams): void => {
  const upsertProjectFromRemote = useProjectStore((state) => state.upsertProjectFromRemote)
  const deleteProjectFromRemote = useProjectStore((state) => state.deleteProjectFromRemote)

  const upsertNoteFromRemote = useBoardStore((state) => state.upsertNoteFromRemote)
  const deleteNoteFromRemote = useBoardStore((state) => state.deleteNoteFromRemote)
  const upsertConnectionFromRemote = useBoardStore((state) => state.upsertConnectionFromRemote)
  const deleteConnectionFromRemote = useBoardStore((state) => state.deleteConnectionFromRemote)

  useEffect(() => {
    if (!userId) return

    const projectsChannel = supabase
      .channel(`projects:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` }, async (payload) => {
        if (payload.eventType === 'DELETE') {
          await deleteProjectFromRemote(String(payload.old.id))
          return
        }

        await upsertProjectFromRemote(projectFromRow(payload.new))
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(projectsChannel)
    }
  }, [deleteProjectFromRemote, upsertProjectFromRemote, userId])

  useEffect(() => {
    if (!projectId) return

    const notesChannel = supabase
      .channel(`notes:${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `project_id=eq.${projectId}` }, async (payload) => {
        if (payload.eventType === 'DELETE') {
          await deleteNoteFromRemote(String(payload.old.id))
          return
        }

        await upsertNoteFromRemote(noteFromRow(payload.new))
      })
      .subscribe()

    const connectionsChannel = supabase
      .channel(`connections:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections', filter: `project_id=eq.${projectId}` },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            await deleteConnectionFromRemote(String(payload.old.id))
            return
          }

          await upsertConnectionFromRemote(connectionFromRow(payload.new))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(notesChannel)
      void supabase.removeChannel(connectionsChannel)
    }
  }, [deleteConnectionFromRemote, deleteNoteFromRemote, projectId, upsertConnectionFromRemote, upsertNoteFromRemote])
}