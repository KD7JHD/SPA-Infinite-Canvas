import React, { useEffect } from 'react'
import { Canvas } from './canvas/Canvas'
import { BlockPanel } from './blocks/BlockPanel'
import { AuthProvider, useAuth } from './state/AuthContext'
import { ProjectProvider, useProject } from './state/ProjectContext'
import { useState } from 'react'

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function TopBar() {
  const { login, logout, isAuthed, profile } = useAuth()
  const { currentProject } = useProject()
  
  return (
    <div className="h-12 border-b flex items-center justify-between px-4 bg-white/70 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="font-semibold">Infinite Canvas</div>
        <div className="text-sm text-gray-600">
          {currentProject.name} • {currentProject.nodes.length} nodes
        </div>
      </div>
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
    <div className="grid grid-cols-[260px_1fr_320px] grid-rows-[48px_1fr] h-[100dvh] bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="col-span-3 row-start-1"><TopBar /></div>
      <aside className="row-start-2 border-r border-gray-200 dark:border-gray-800 px-3 py-2 overflow-auto">
        <ErrorBoundary>
          <ProjectSidebar />
        </ErrorBoundary>
      </aside>
      <main className="row-start-2 overflow-hidden">
        <ErrorBoundary>
          <Canvas />
        </ErrorBoundary>
      </main>
      <aside className="row-start-2 border-l border-gray-200 dark:border-gray-800 px-3 py-2 overflow-auto">
        <ErrorBoundary>
          <BlockPanel />
        </ErrorBoundary>
      </aside>
    </div>
  )
}

function ProjectSidebar() {
  const { 
    projects, 
    currentProject, 
    createProject, 
    switchProject, 
    deleteProject 
  } = useProject()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name')
      return
    }
    createProject(newProjectName.trim())
    setShowCreateModal(false)
    setNewProjectName("")
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium">Projects</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700"
        >
          + New
        </button>
      </div>

      {/* Project List */}
      <div className="space-y-2">
        {projects.map(project => (
          <div
            key={project.id}
            className={`p-3 rounded border cursor-pointer transition-colors ${
              project.id === currentProject.id 
                ? 'bg-indigo-50 border-indigo-200' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => switchProject(project.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-sm">{project.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {project.blocks.length} blocks, {project.nodes.length} nodes
                  {project.isDefault && ' (Default)'}
                </div>
              </div>
              {!project.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete project "${project.name}"?`)) {
                      deleteProject(project.id)
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-xs px-1 ml-2"
                  title="Delete project"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Project</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
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