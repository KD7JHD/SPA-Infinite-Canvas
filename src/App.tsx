import { useEffect } from 'react'
import { Canvas } from './canvas/Canvas'
import { BlockPanel } from './blocks/BlockPanel'
import { AuthProvider, useAuth } from './state/AuthContext'
import { ProjectProvider } from './state/ProjectContext'

function TopBar() {
  const { login, logout, isAuthed, profile } = useAuth()
  return (
    <div className="h-12 border-b flex items-center justify-between px-4 bg-white/70 backdrop-blur">
      <div className="font-semibold">Infinite Canvas</div>
      <div className="flex items-center gap-3">
        {isAuthed && profile ? (
          <>
            <img src={profile.avatar_url} alt="avatar" className="w-7 h-7 rounded-full" />
            <span className="text-sm">{profile.login}</span>
            <button onClick={logout} className="px-3 py-1 rounded bg-gray-200">Logout</button>
          </>
        ) : (
          <button onClick={login} className="px-3 py-1 rounded bg-black text-white">Sign in with GitHub</button>
        )}
      </div>
    </div>
  )
}

function Shell() {
  useEffect(() => {
    document.body.classList.add('bg-gray-50')
  }, [])

  return (
    <div className="grid grid-cols-[260px_1fr_320px] grid-rows-[48px_1fr] h-[100dvh]">
      <div className="col-span-3 row-start-1"><TopBar /></div>
      <aside className="row-start-2 border-r px-3 py-2 overflow-auto">
        <h2 className="font-medium mb-2">Projects</h2>
        <p className="text-sm text-gray-600">Coming soon. Current session is in memory.</p>
      </aside>
      <main className="row-start-2 overflow-hidden"><Canvas /></main>
      <aside className="row-start-2 border-l px-3 py-2 overflow-auto">
        <BlockPanel />
      </aside>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Shell />
      </ProjectProvider>
    </AuthProvider>
  )
}