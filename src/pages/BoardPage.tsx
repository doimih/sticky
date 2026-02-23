import { useMemo, useState } from 'react'
import { BoardCanvas } from '../components/canvas/BoardCanvas'
import { useBoardBootstrap } from '../hooks/useBoardBootstrap'
import { useRealtimeSync } from '../hooks/useRealtimeSync'
import { isSupabaseConfigured } from '../lib/supabase/client'
import { useAuthStore } from '../store/useAuthStore'
import { useBoardStore } from '../store/useBoardStore'
import { useProjectStore } from '../store/useProjectStore'

export function BoardPage() {
  const { userId, loading } = useBoardBootstrap()
  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)
  const signOut = useAuthStore((state) => state.signOut)
  const updatePassword = useAuthStore((state) => state.updatePassword)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectError, setProjectError] = useState<string | null>(null)

  const projects = useProjectStore((state) => state.projects)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProject = useProjectStore((state) => state.setActiveProject)
  const createProject = useProjectStore((state) => state.createProject)

  const notes = useBoardStore((state) => state.notes)
  const connections = useBoardStore((state) => state.connections)
  const searchQuery = useBoardStore((state) => state.searchQuery)
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery)
  const createNote = useBoardStore((state) => state.createNote)
  const updateNotePosition = useBoardStore((state) => state.updateNotePosition)
  const moveNoteToVisibleArea = useBoardStore((state) => state.moveNoteToVisibleArea)
  const updateNoteContent = useBoardStore((state) => state.updateNoteContent)
  const createConnection = useBoardStore((state) => state.createConnection)
  const deleteConnection = useBoardStore((state) => state.deleteConnection)

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  useRealtimeSync({ userId, projectId: activeProjectId })

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return notes

    return notes.filter((note) => {
      const haystack = [note.title, note.content, note.tags.join(' ')].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [notes, searchQuery])

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null
  const colorOptions = ['#fef08a', '#fecaca', '#bfdbfe', '#bbf7d0', '#e9d5ff', '#fdba74']

  const relatedConnections = useMemo(() => {
    if (!selectedNote) return []
    return connections.filter((connection) => connection.noteIdFrom === selectedNote.id || connection.noteIdTo === selectedNote.id)
  }, [connections, selectedNote])

  const noteTitleById = useMemo(() => {
    const map = new Map<string, string>()
    for (const note of notes) {
      map.set(note.id, note.title || 'Untitled')
    }
    return map
  }, [notes])

  if (loading) {
    return <section className="grid h-full place-items-center text-sm text-slate-400">Loading session...</section>
  }

  if (!userId) {
    return (
      <section className="grid h-full place-items-center px-4">
        <div className="w-full max-w-sm space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h1 className="text-base font-semibold">Sign in to Sticky</h1>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {authError && <p className="text-sm text-rose-400">{authError}</p>}
          <div className="flex gap-2">
            <button
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500"
              onClick={async () => {
                try {
                  setAuthError(null)
                  await signIn(email, password)
                } catch (error) {
                  setAuthError(error instanceof Error ? error.message : 'Sign in failed')
                }
              }}
            >
              Sign In
            </button>
            <button
              className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-600"
              onClick={async () => {
                try {
                  setAuthError(null)
                  await signUp(email, password)
                } catch (error) {
                  setAuthError(error instanceof Error ? error.message : 'Sign up failed')
                }
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex h-full w-full flex-col">
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4">
        <h1 className="text-lg font-semibold">Sticky Board</h1>

        {!isSupabaseConfigured && (
          <p className="rounded-md border border-amber-500/60 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
            Cloud sync is OFF (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
          </p>
        )}

        <select
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm"
          value={activeProjectId ?? ''}
          onChange={(event) => setActiveProject(event.target.value)}
        >
          {projects.length === 0 && <option value="">No project</option>}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <input
          className="w-44 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm outline-none"
          placeholder="Project name"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            const name = projectName.trim()
            if (!name) {
              setProjectError('Enter project name first.')
              return
            }
            setProjectError(null)
            void createProject(name, userId)
            setProjectName('')
          }}
        />

        <button
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
          onClick={() => {
            const name = projectName.trim()
            if (!name) {
              setProjectError('Enter project name first.')
              return
            }
            setProjectError(null)
            void createProject(name, userId)
            setProjectName('')
          }}
        >
          Create Project
        </button>

        <input
          className="w-72 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm outline-none"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

        <button
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500"
          onClick={() => {
            if (!activeProjectId) {
              setProjectError('Create or select a project first.')
              return
            }

            setProjectError(null)
            if (searchQuery.trim()) {
              setSearchQuery('')
            }
            void createNote(activeProjectId, userId)
          }}
        >
          Add Note
        </button>

        <button
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-600"
          onClick={() => {
            if (!activeProjectId || filteredNotes.length < 2) return
            const from = filteredNotes[0]
            const to = filteredNotes[1]
            void createConnection(activeProjectId, from.id, to.id)
          }}
        >
          Connect First 2
        </button>

        <button
          className="ml-auto grid h-9 w-9 place-items-center rounded-md bg-slate-700 hover:bg-slate-600"
          title="Change password"
          onClick={() => {
            setPasswordError(null)
            setPasswordMessage(null)
            setNewPassword('')
            setConfirmPassword('')
            setIsPasswordModalOpen(true)
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21a8 8 0 1 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        <button className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium hover:bg-rose-500" onClick={() => void signOut()}>
          Sign Out
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1" onClick={() => setSelectedNoteId(null)}>
          {projectError && <p className="px-4 pt-2 text-sm text-rose-400">{projectError}</p>}
          <BoardCanvas
            notes={filteredNotes}
            connections={connections}
            onNoteDragEnd={(noteId, x, y) => {
              void updateNotePosition(noteId, x, y)
            }}
          />
        </div>

        <aside className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Notes</h2>
          {notes.length === 0 && <p className="text-sm text-slate-500">No notes yet in this project.</p>}

          {notes.length > 0 && (
            <div className="mb-4 max-h-52 space-y-1 overflow-y-auto pr-1">
              {notes.map((note) => (
                <button
                  key={note.id}
                  className={`w-full truncate rounded-md px-2 py-1.5 text-left text-sm ${
                    selectedNoteId === note.id
                      ? 'border border-blue-500 bg-blue-600/20 text-blue-200'
                      : 'border border-transparent bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  {note.title || 'Untitled'}
                </button>
              ))}
            </div>
          )}

          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Note Editor</h3>
          {!selectedNote && <p className="text-sm text-slate-500">Click a note name from the list to open editor.</p>}

          {selectedNote && (
            <div className="space-y-3">
              <p className="rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-xs text-blue-200">
                Selected: {selectedNote.title || 'Untitled'}
              </p>
              <button
                className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-600"
                onClick={() => void moveNoteToVisibleArea(selectedNote.id)}
              >
                Bring to view
              </button>
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
                value={selectedNote.title}
                onChange={(event) => void updateNoteContent(selectedNote.id, { title: event.target.value })}
              />

              <textarea
                className="h-44 w-full resize-none rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
                value={selectedNote.content}
                onChange={(event) => void updateNoteContent(selectedNote.id, { content: event.target.value })}
              />

              <input
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
                placeholder="comma,separated,tags"
                value={selectedNote.tags.join(',')}
                onChange={(event) =>
                  void updateNoteContent(selectedNote.id, {
                    tags: event.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
              />

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Color</p>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`h-7 w-7 rounded-full border-2 ${selectedNote.color === color ? 'border-white' : 'border-slate-600'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => void updateNoteContent(selectedNote.id, { color })}
                      title={`Set color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Connections</p>
                {relatedConnections.length === 0 && <p className="text-sm text-slate-500">No connections for this note.</p>}
                {relatedConnections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between rounded-md bg-slate-800 px-2 py-1.5 text-xs text-slate-300">
                    <span className="truncate pr-2">
                      {noteTitleById.get(connection.noteIdFrom)} → {noteTitleById.get(connection.noteIdTo)}
                    </span>
                    <button className="rounded bg-rose-600 px-2 py-0.5 text-white hover:bg-rose-500" onClick={() => void deleteConnection(connection.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="w-full max-w-md space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-base font-semibold">Change Password</h3>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {passwordError && <p className="text-sm text-rose-400">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-emerald-400">{passwordMessage}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-600" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500"
                onClick={async () => {
                  try {
                    setPasswordError(null)
                    setPasswordMessage(null)

                    if (newPassword.length < 8) {
                      setPasswordError('Password must be at least 8 characters.')
                      return
                    }

                    if (newPassword !== confirmPassword) {
                      setPasswordError('Passwords do not match.')
                      return
                    }

                    await updatePassword(newPassword)
                    setNewPassword('')
                    setConfirmPassword('')
                    setIsPasswordModalOpen(false)
                  } catch (error) {
                    setPasswordError(error instanceof Error ? error.message : 'Could not update password.')
                  }
                }}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}