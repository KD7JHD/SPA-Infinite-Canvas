import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

// Block configuration type
export type BlockConfig = {
  id: string
  name: string
  systemPrompt: string
  description: string
  firstQuestion: string
  suggestions: string[]
  isBuiltIn?: boolean
  category?: string
  color?: string
}

// Node state type
export type NodeState = {
  id: string
  blockId: string
  x: number
  y: number
  history: Array<any>
  lastSchema: any | null
  config?: any
}

// Project type
export type Project = {
  id: string
  name: string
  nodes: NodeState[]
  blocks: BlockConfig[]
  isDefault?: boolean
}

// Default built-in blocks
const DEFAULT_BLOCKS: BlockConfig[] = [
  {
    id: 'lyricist',
    name: "Expert Lyricist",
    systemPrompt: "You are an expert lyricist who helps users create compelling song lyrics through a guided conversation.",
    description: "Let's begin crafting your soul-stirring lyrics. I'll guide you through each element to ensure we create something truly compelling.",
    firstQuestion: "First, let's establish the foundation - what is the theme or central idea for this song?",
    suggestions: [
      "Love and relationships (lost love, new romance, unrequited feelings, etc.)",
      "Personal transformation and growth (overcoming obstacles, self-discovery, redemption)",
      "Social commentary (inequality, hope for change, human connection across divides)",
      "Existential reflection (purpose, mortality, the search for meaning)",
      "Memory and nostalgia (childhood, past eras, places left behind)",
      "Resilience and survival (overcoming trauma, finding strength, perseverance)",
      "Something else entirely (please describe your specific theme)"
    ],
    isBuiltIn: true,
    category: 'Creative Writing',
    color: '#1f2937'
  },
  {
    id: 'novelist',
    name: "Novelist",
    systemPrompt: "You are an expert novelist who helps users develop compelling story ideas and characters through guided conversation.",
    description: "Let's create an engaging story together. I'll help you develop your plot, characters, and narrative structure.",
    firstQuestion: "What type of creative writing project would you like me to help you with?",
    suggestions: [
      "Science fiction (space exploration, futuristic societies, alien encounters)",
      "Fantasy (magical worlds, epic quests, mythical creatures)",
      "Mystery/Thriller (crime solving, suspense, psychological drama)",
      "Romance (love stories, relationship dynamics, emotional journeys)",
      "Historical fiction (period pieces, historical events, cultural exploration)",
      "Literary fiction (character studies, social commentary, philosophical themes)",
      "Something else entirely (please describe your specific idea)"
    ],
    isBuiltIn: true,
    category: 'Creative Writing',
    color: '#1f2937'
  }
]

// Storage keys
const STORAGE_KEYS = {
  PROJECTS: 'infinite-canvas-projects',
  CURRENT_PROJECT: 'infinite-canvas-current-project'
}

// Load data from localStorage
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error)
    return defaultValue
  }
}

// Save data to localStorage
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error)
  }
}

// Initialize default project
const createDefaultProject = (): Project => ({
  id: 'default',
  name: 'Default Project',
  nodes: [],
  blocks: [...DEFAULT_BLOCKS],
  isDefault: true
})

// Load projects from storage or create default
const loadProjects = (): Project[] => {
  const storedProjects = loadFromStorage(STORAGE_KEYS.PROJECTS, [])
  
  if (storedProjects.length === 0) {
    // First time - create default project
    const defaultProject = createDefaultProject()
    saveToStorage(STORAGE_KEYS.PROJECTS, [defaultProject])
    saveToStorage(STORAGE_KEYS.CURRENT_PROJECT, defaultProject.id)
    return [defaultProject]
  }
  
  // Ensure default project exists and has all built-in blocks
  const hasDefault = storedProjects.find(p => p.isDefault)
  if (!hasDefault) {
    const defaultProject = createDefaultProject()
    storedProjects.unshift(defaultProject)
    saveToStorage(STORAGE_KEYS.PROJECTS, storedProjects)
  }
  
  return storedProjects
}

const Ctx = createContext<{
  projects: Project[]
  currentProject: Project
  addNode: (n: Omit<NodeState, 'id'>) => void
  updateNode: (id: string, patch: Partial<NodeState>) => void
    removeNode: (id: string) => void
  addBlock: (block: Omit<BlockConfig, 'id'>) => void
  updateBlock: (id: string, patch: Partial<BlockConfig>) => void
  removeBlock: (id: string) => void
  // Blocks: Read helpers
  getBlock: (id: string) => BlockConfig | undefined
  listBlocks: () => BlockConfig[]
  // Alias for clarity (Delete in CRUD)
  deleteBlock: (id: string) => void
  createProject: (name: string) => void
  switchProject: (projectId: string) => void
  deleteProject: (projectId: string) => void
  // UI state for right sidebar configuration editor
  configuringBlockId: string | null
  setConfiguringBlockId: (id: string | null) => void
  // UI state for selected node (for inline form card)
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
} | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => 
    loadFromStorage(STORAGE_KEYS.CURRENT_PROJECT, 'default')
  )
  // UI state: which block is currently being configured in the right sidebar
  const [configuringBlockId, setConfiguringBlockId] = useState<string | null>(null)
  // UI state: which node is currently selected for inline form editing
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const currentProject = useMemo(() => 
    projects.find(p => p.id === currentProjectId) || projects[0] || createDefaultProject(), 
    [projects, currentProjectId]
  )

  // Save projects to localStorage whenever they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROJECTS, projects)
  }, [projects])

  // Save current project ID to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_PROJECT, currentProjectId)
  }, [currentProjectId])

  const addNode = (n: Omit<NodeState, 'id'>) => {
    console.log('ProjectContext: addNode called with:', n)
    const id = 'node-' + Math.random().toString(36).slice(2, 8)
    const newNode = { id, ...n }
    console.log('ProjectContext: creating new node:', newNode)
    
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === currentProjectId 
          ? { ...project, nodes: [...project.nodes, newNode] }
          : project
      )
    )
  }

  const updateNode = (id: string, patch: Partial<NodeState>) => {
    console.log('ProjectContext: updateNode called for id:', id, 'with patch:', patch)
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === currentProjectId 
          ? {
              ...project,
              nodes: project.nodes.map(n => n.id === id ? { ...n, ...patch } : n)
            }
          : project
      )
    )
  }

  const removeNode = (id: string) => {
    console.log('ProjectContext: removeNode called for id:', id)
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === currentProjectId
          ? {
              ...project,
              nodes: project.nodes.filter(n => n.id !== id)
            }
          : project
      )
    )
  }

  const addBlock = (block: Omit<BlockConfig, 'id'>) => {
    const newBlock: BlockConfig = {
      ...block,
      id: 'block-' + Math.random().toString(36).slice(2, 8)
    }
    
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === currentProjectId 
          ? { ...project, blocks: [...project.blocks, newBlock] }
          : project
      )
    )
  }

  const updateBlock = (id: string, patch: Partial<BlockConfig>) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === currentProjectId 
          ? {
              ...project,
              blocks: project.blocks.map(b => b.id === id ? { ...b, ...patch } : b)
            }
          : project
      )
    )
  }

  const removeBlock = (id: string) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === currentProjectId 
          ? {
              ...project,
              blocks: project.blocks.filter(b => b.id !== id)
            }
          : project
      )
    )
  }

  // Blocks: Read helpers
  const getBlock = (id: string): BlockConfig | undefined => {
    return currentProject.blocks.find(b => b.id === id)
  }

  const listBlocks = (): BlockConfig[] => {
    return currentProject.blocks
  }

  // Alias for clarity (Delete in CRUD)
  const deleteBlock = (id: string) => removeBlock(id)

  const createProject = (name: string) => {
    const newProject: Project = {
      id: 'project-' + Math.random().toString(36).slice(2, 8),
      name,
      nodes: [],
      blocks: [...DEFAULT_BLOCKS] // New projects start with built-in blocks
    }
    
    setProjects(prev => [...prev, newProject])
    setCurrentProjectId(newProject.id)
  }

  const switchProject = (projectId: string) => {
    setCurrentProjectId(projectId)
  }

  const deleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId)
    if (projectToDelete?.isDefault) {
      console.warn('Cannot delete default project')
      return
    }
    
    setProjects(prev => prev.filter(p => p.id !== projectId))
    
    // If we're deleting the current project, switch to default
    if (currentProjectId === projectId) {
      const defaultProject = projects.find(p => p.isDefault)
      if (defaultProject) {
        setCurrentProjectId(defaultProject.id)
      }
    }
  }

  const value = useMemo(() => ({ 
    projects, 
    currentProject, 
    addNode, 
    updateNode,
    removeNode,
    addBlock, 
    updateBlock, 
    removeBlock,
    getBlock,
    listBlocks,
    deleteBlock,
    createProject,
    switchProject,
    deleteProject,
    configuringBlockId,
    setConfiguringBlockId,
    selectedNodeId,
    setSelectedNodeId
  }), [projects, currentProject, currentProjectId, configuringBlockId, selectedNodeId])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useProject = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ProjectContext missing')
  return ctx
}