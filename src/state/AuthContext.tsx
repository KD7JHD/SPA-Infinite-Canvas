import React, { createContext, useContext, useMemo, useState } from 'react'
import { CONFIG } from '../config'
import { beginOAuth, finishOAuth, getProfile } from '../lib/github'

type Profile = { login: string; avatar_url: string }

type AuthState = {
  isAuthed: boolean
  token: string | null
  profile: Profile | null
  login: () => void
  logout: () => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  React.useEffect(() => {
    // Handle redirect callback
    const url = new URL(window.location.href)
    if (url.pathname.endsWith('/auth/callback') && url.searchParams.get('code')) {
      const code = url.searchParams.get('code')!
      finishOAuth(code).then(async (tok) => {
        setToken(tok)
        const p = await getProfile(tok)
        setProfile({ login: p.login, avatar_url: p.avatar_url })
        history.replaceState({}, '', CONFIG.APP_ORIGIN + '/')
      }).catch(console.error)
    }
  }, [])

  const value = useMemo<AuthState>(() => ({
    isAuthed: !!token,
    token,
    profile,
    login: () => beginOAuth(),
    logout: () => { setToken(null); setProfile(null) },
  }), [token, profile])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AuthContext missing')
  return ctx
}