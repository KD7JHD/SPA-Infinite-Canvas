import React, { createContext, useContext, useMemo, useState } from 'react'

export type NodeState = {
  id: string
  blockId: 'lyricist'
  x: number
  y: number
  history: Array<any>
  lastSchema: any | null
}

export type Project = {
  id: string
  title: string
  nodes: NodeState[]
}

const initial: Project = {
  id: 'proj-1',
  title: 'Untitled',
  nodes: []
}

const Ctx = createContext<{
  project: Project
  addNode: (n: Omit<NodeState, 'id'>) => void
  updateNode: (id: string, patch: Partial<NodeState>) => void
} | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project>(initial)

  const addNode = (n: Omit<NodeState, 'id'>) => {
    const id = 'node-' + Math.random().toString(36).slice(2, 8)
    setProject(p => ({ ...p, nodes: [...p.nodes, { id, ...n }] }))
  }

  const updateNode = (id: string, patch: Partial<NodeState>) => {
    setProject(p => ({
      ...p,
      nodes: p.nodes.map(n => n.id === id ? { ...n, ...patch } : n)
    }))
  }

  const value = useMemo(() => ({ project, addNode, updateNode }), [project])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useProject = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ProjectContext missing')
  return ctx
}