import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'

interface AuthState {
  session: Session | null
  loading: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

let hasRegisteredListener = false

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,

  init: async () => {
    const { data } = await supabase.auth.getSession()
    set({ session: data.session, loading: false })

    if (!hasRegisteredListener) {
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, loading: false })
      })
      hasRegisteredListener = true
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}))