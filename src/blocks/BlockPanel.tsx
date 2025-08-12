import React, { useState } from 'react'
import { useProject } from '../state/ProjectContext'
// Inline node form is rendered within the canvas, not here

export function BlockPanel() {
  const { 
    currentProject, 
    addNode, 
    addBlock, 
    removeBlock, 
    updateBlock,
    configuringBlockId,
    setConfiguringBlockId
  } = useProject()
  const [isDragging, setIsDragging] = useState(false)
  const [showCreateInline, setShowCreateInline] = useState(false)
  const [currentDraft, setCurrentDraft] = useState<any | null>(null)
  const [newBlockConfig, setNewBlockConfig] = useState({
    name: "",
    systemPrompt: "",
    description: "",
    firstQuestion: "",
    suggestions: [""],
    category: "Custom",
    color: "#1f2937"
  })
  
  const handleAddBlock = (block: any) => {
    console.log('Adding block node...')
    const newNode = { 
      blockId: block.id, 
      x: 200, 
      y: 120, 
      history: [], 
      lastSchema: null,
      config: {
        name: block.name,
        systemPrompt: block.systemPrompt,
        description: block.description,
        firstQuestion: block.firstQuestion,
        suggestions: block.suggestions
      }
    }
    console.log('New node data:', newNode)
    addNode(newNode)
  }

  const handleDragStart = (e: React.DragEvent, block: any) => {
    setIsDragging(true)
    e.dataTransfer.setData('application/json', JSON.stringify({
      blockId: block.id,
      history: [],
      lastSchema: null,
      config: {
        name: block.name,
        systemPrompt: block.systemPrompt,
        description: block.description,
        firstQuestion: block.firstQuestion,
        suggestions: block.suggestions
      }
    }))
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleCreateBlock = () => {
    // Validate required fields
    if (!newBlockConfig.name || !newBlockConfig.systemPrompt || !newBlockConfig.firstQuestion) {
      alert('Please fill in all required fields (Name, System Prompt, First Question)')
      return
    }

    // Filter out empty suggestions
    const validSuggestions = newBlockConfig.suggestions.filter(s => s.trim() !== '')
    if (validSuggestions.length === 0) {
      alert('Please add at least one suggestion')
      return
    }

    const customBlock = {
      name: newBlockConfig.name,
      systemPrompt: newBlockConfig.systemPrompt,
      description: newBlockConfig.description,
      firstQuestion: newBlockConfig.firstQuestion,
      suggestions: validSuggestions,
      category: newBlockConfig.category,
      color: newBlockConfig.color
    }
    
    addBlock(customBlock)
    setShowCreateInline(false)
    setNewBlockConfig({
      name: "",
      systemPrompt: "",
      description: "",
      firstQuestion: "",
      suggestions: [""],
      category: "Custom",
      color: "#1f2937"
    })
  }

  const addSuggestion = () => {
    setNewBlockConfig(prev => ({
      ...prev,
      suggestions: [...prev.suggestions, ""]
    }))
  }

  const updateSuggestion = (index: number, value: string) => {
    setNewBlockConfig(prev => ({
      ...prev,
      suggestions: prev.suggestions.map((s, i) => i === index ? value : s)
    }))
  }

  const removeSuggestion = (index: number) => {
    setNewBlockConfig(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter((_, i) => i !== index)
    }))
  }

  // Inline node form removed; handled in Canvas instead
  function InlineNodeFormCard({ node, onClose, onUpdate }: { node: any; onClose: () => void; onUpdate: (patch: any) => void }) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<any>({})
    const isFirstStep = (node.history?.length || 0) === 0
    const [firstStepSelections, setFirstStepSelections] = useState<string[]>([])
    const [firstStepCustomInput, setFirstStepCustomInput] = useState<string>('')
    const [firstStepQuick, setFirstStepQuick] = useState<string>('')

    const submit = async () => {
      setBusy(true)
      setError(null)
      try {
        const body = {
          step: (node.history?.length || 0) + 1,
          answers: isFirstStep
            ? {
                selectedOptions: firstStepSelections,
                customInput: firstStepCustomInput,
                quickSelection: firstStepQuick
              }
            : formData,
          previous_form_schema: node.lastSchema,
          history: node.history || [],
          metadata: { nodeId: node.id }
        }
        // postToN8n removed from panel; form submission is handled in Canvas
        const res = { ok: false, json: { error: 'Not available here' } } as any
        setBusy(false)
        if (!res.ok) {
          setError(res.json?.error || 'Request failed')
          return
        }
        const next = res.json
        if (next?.next_form_schema) {
          setFormData({})
          const storedAnswers = isFirstStep
            ? { selectedOptions: firstStepSelections, customInput: firstStepCustomInput, quickSelection: firstStepQuick }
            : formData
          onUpdate({ lastSchema: next.next_form_schema, history: [...(node.history || []), { answers: storedAnswers, schema: node.lastSchema }] })
        }
      } catch (err: any) {
        setBusy(false)
        setError('Network error: ' + err)
      }
    }

    return (
      <div className="mb-4 p-3 rounded border border-indigo-300 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/40">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-medium text-indigo-900 dark:text-indigo-200">{node.config?.name || 'Node'}</div>
            <div className="text-xs text-indigo-800/80 dark:text-indigo-300/80">Inline Form</div>
          </div>
          <button className="text-indigo-700 dark:text-indigo-300 hover:underline text-xs" onClick={onClose}>Close</button>
        </div>
        {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
        {isFirstStep ? (
          <div className="space-y-3">
            {node.config?.firstQuestion && (
              <div className="text-sm text-gray-800 dark:text-gray-200">{node.config.firstQuestion}</div>
            )}
            <div className="space-y-2">
              {(node.config?.suggestions || []).map((opt: string, idx: number) => {
                const id = `opt-${idx}`
                const checked = firstStepSelections.includes(opt)
                return (
                  <label key={id} htmlFor={id} className="flex items-center gap-2 text-sm">
                    <input
                      id={id}
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={(e) => {
                        setFirstStepSelections((prev) =>
                          e.target.checked ? [...prev, opt] : prev.filter((o) => o !== opt)
                        )
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                )
              })}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quick selection by numbers</label>
              <input
                type="text"
                value={firstStepQuick}
                onChange={(e) => setFirstStepQuick(e.target.value)}
                placeholder="e.g., 1,3,5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your own idea (optional)</label>
              <textarea
                value={firstStepCustomInput}
                onChange={(e) => setFirstStepCustomInput(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                placeholder="Describe your specific idea..."
              />
            </div>
          </div>
        ) : (
          node.lastSchema ? (
            <div className="text-xs text-gray-600 dark:text-gray-300">Form schema loaded.</div>
          ) : (
            <div className="text-xs text-gray-600 dark:text-gray-300">No form schema available yet.</div>
          )
        )}
        <button
          onClick={submit}
          disabled={busy}
          className="mt-3 w-full px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? 'Sending…' : node?.lastSchema?.ui?.submitLabel || 'Submit'}
        </button>
      </div>
    )
  }

  // Group blocks by category
  const blocksByCategory = currentProject.blocks.reduce((acc, block) => {
    const category = block.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(block)
    return acc
  }, {} as Record<string, any[]>)
  
  return (
    <div>
      {/* Node inline form is rendered in Canvas */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-900 dark:text-gray-100">Building blocks</h2>
      </div>
      
      {/* Create Block Button */}
      <button
        onClick={() => setShowCreateInline(v => !v)}
        className="w-full text-center px-3 py-4 rounded border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 mb-4 transition-colors"
      >
        <div className="text-3xl text-blue-600 dark:text-blue-400 mb-1">+</div>
        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Create Custom Block</div>
      </button>

      {/* Project Info */}
      <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
        <div className="font-medium text-gray-900 dark:text-gray-100">{currentProject.name}</div>
        <div className="text-gray-600 dark:text-gray-400">{currentProject.blocks.length} blocks, {currentProject.nodes.length} nodes</div>
      </div>
      
      {/* Blocks by Category */}
      {Object.entries(blocksByCategory).map(([category, blocks]) => (
        <div key={category} className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{category}</h3>
          <div className="space-y-2">
            {blocks.map(block => {
              const isExpanded = configuringBlockId === block.id
              const displayColor = (isExpanded && currentDraft?.color) ? currentDraft.color : (block.color || '#1f2937')
              return (
                <div
                  key={block.id}
                  draggable={!isExpanded}
                  onDragStart={(e) => !isExpanded && handleDragStart(e, block)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    setConfiguringBlockId(block.id)
                    setCurrentDraft({
                      name: block.name,
                      systemPrompt: block.systemPrompt,
                      description: block.description,
                      firstQuestion: block.firstQuestion,
                      suggestions: block.suggestions,
                      category: block.category || 'Custom',
                      color: block.color || '#1f2937'
                    })
                  }}
                  className={`w-full text-left rounded border border-l-4 transition-colors ${
                    isExpanded
                      ? 'bg-white dark:bg-gray-900 border-indigo-300 dark:border-indigo-700'
                      : isDragging
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  style={{ borderLeftColor: displayColor as string }}
                >
                  <div className={`px-3 py-2 ${isExpanded ? 'border-b border-gray-200 dark:border-gray-800' : ''} ${!isExpanded ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{isExpanded && currentDraft ? currentDraft.name : block.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {isExpanded && currentDraft
                            ? (currentDraft.description || currentDraft.firstQuestion)
                            : (block.description || block.firstQuestion)}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {/* Configuration button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfiguringBlockId(block.id)
                            setCurrentDraft({
                              name: block.name,
                              systemPrompt: block.systemPrompt,
                              description: block.description,
                              firstQuestion: block.firstQuestion,
                              suggestions: block.suggestions,
                              category: block.category || 'Custom'
                            })
                          }}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs px-1"
                          title="Configure block"
                        >
                          ⚙
                        </button>
                        {/* Delete button for custom blocks */}
                        {!block.isBuiltIn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Delete block "${block.name}"?`)) {
                                removeBlock(block.id)
                              }
                            }}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs px-1"
                            title="Delete block"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div
                      className="p-3"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <BlockConfigEditor
                        block={block}
                        onDraftChange={setCurrentDraft}
                        onClose={() => { setConfiguringBlockId(null); setCurrentDraft(null) }}
                        onUpdate={(patch) => {
                          updateBlock(block.id, patch)
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Drag blocks to canvas for placement.
        <br />
        <span className="text-blue-600 dark:text-blue-400">💡 Tip: Click the ⚙️ icon to configure blocks!</span>
      </p>

      {/* Create Block Inline Card */}
      {showCreateInline && (
        <div className="rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">➕ Create Custom Block</h3>
            <button 
              onClick={() => setShowCreateInline(false)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block Name *
                </label>
                <input
                  type="text"
                  value={newBlockConfig.name}
                  onChange={(e) => setNewBlockConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Story Writer, Code Generator, etc."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newBlockConfig.category}
                  onChange={(e) => setNewBlockConfig(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Creative Writing, Programming, etc."
                />
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Prompt *
                </label>
                <textarea
                  value={newBlockConfig.systemPrompt}
                  onChange={(e) => setNewBlockConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Define the AI's role and behavior..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newBlockConfig.description}
                  onChange={(e) => setNewBlockConfig(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of what this block does..."
                />
              </div>

              {/* First Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Question *
                </label>
                <textarea
                  value={newBlockConfig.firstQuestion}
                  onChange={(e) => setNewBlockConfig(prev => ({ ...prev, firstQuestion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="The first question to ask the user..."
                />
              </div>

              {/* Suggestions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suggestions *
                </label>
                <div className="space-y-2">
                  {newBlockConfig.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={suggestion}
                        onChange={(e) => updateSuggestion(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Suggestion ${index + 1}`}
                      />
                      <button
                        onClick={() => removeSuggestion(index)}
                        className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                        disabled={newBlockConfig.suggestions.length <= 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addSuggestion}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    + Add Suggestion
                  </button>
                </div>
              </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowCreateInline(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBlock}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Block
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// Block Configuration Editor Component (sidebar)
function BlockConfigEditor({ block, onClose, onUpdate, onDraftChange }: {
  block: any;
  onClose: () => void;
  onUpdate: (patch: any) => void;
  onDraftChange?: (draft: any) => void;
}) {
  const [config, setConfig] = useState(() => {
    return {
      name: block?.name || "",
      systemPrompt: block?.systemPrompt || "",
      description: block?.description || "",
      firstQuestion: block?.firstQuestion || "",
      suggestions: block?.suggestions || [""],
      category: block?.category || "Custom",
      color: block?.color || "#1f2937"
    }
  })
  const [saving, setSaving] = useState(false)
  const colorInputRef = React.useRef<HTMLInputElement | null>(null)

  const addSuggestion = () => {
    setConfig(prev => ({
      ...prev,
      suggestions: [...prev.suggestions, ""]
    }))
  }

  const updateSuggestion = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      suggestions: prev.suggestions.map((s, i) => i === index ? value : s)
    }))
  }

  const removeSuggestion = (index: number) => {
    setConfig(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter((_, i) => i !== index)
    }))
  }

  // Reflect config state upward for live header updates and button state
  React.useEffect(() => {
    onDraftChange?.(config)
  }, [config])

  const saveConfig = async () => {
    // Validate required fields
    if (!config.name || !config.systemPrompt || !config.firstQuestion) {
      alert('Please fill in all required fields (Name, System Prompt, First Question)')
      return
    }

    // Filter out empty suggestions
    const validSuggestions = config.suggestions.filter(s => s.trim() !== '')
    if (validSuggestions.length === 0) {
      alert('Please add at least one suggestion')
      return
    }

    setSaving(true)
    try {
      await Promise.resolve(onUpdate({
        ...config,
        suggestions: validSuggestions
      }))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold">⚙️ Edit Block</h3>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
          title="Close"
        >
          ✕
        </button>
      </div>
      <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Block Name *
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Expert Lyricist, Story Writer, etc."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={config.category}
              onChange={(e) => setConfig(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Creative Writing, Programming, etc."
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Block Color
            </label>
            <div className="flex items-center gap-3">
              {/* Quick select swatches */}
              <div className="flex items-center gap-2">
                {['#1f2937', '#4f46e5', '#059669'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, color: c }))}
                    className={`h-7 w-7 rounded-md border ${
                      config.color === c
                        ? 'ring-2 ring-offset-2 ring-indigo-500 border-transparent'
                        : 'border-gray-300 dark:border-gray-700'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Set color ${c}`}
                    title={c}
                  />
                ))}
              </div>
              {/* Color wheel trigger button */}
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                aria-label="Choose color"
                title="Choose color"
              >
                <span aria-hidden>🎨</span>
                <span className="h-4 w-4 rounded-sm border border-gray-300 dark:border-gray-700" style={{ backgroundColor: config.color }} />
              </button>
              {/* Visually hidden native color input; opens picker */}
              <input
                ref={colorInputRef}
                type="color"
                value={config.color}
                onChange={(e) => setConfig(prev => ({ ...prev, color: e.target.value }))}
                className="sr-only"
                aria-label="Color picker"
              />
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt *
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Define the AI's role and behavior..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief description of what this block does..."
            />
          </div>

          {/* First Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Question *
            </label>
            <textarea
              value={config.firstQuestion}
              onChange={(e) => setConfig(prev => ({ ...prev, firstQuestion: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="The first question to ask the user..."
            />
          </div>

          {/* Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suggestions *
            </label>
            <div className="space-y-2">
              {config.suggestions.map((suggestion, index) => (
                <div key={index} className="flex gap-2">
                    <input
                    type="text"
                    value={suggestion}
                    onChange={(e) => updateSuggestion(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Suggestion ${index + 1}`}
                  />
                  <button
                    onClick={() => removeSuggestion(index)}
                    className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                    disabled={config.suggestions.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addSuggestion}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                + Add Suggestion
              </button>
            </div>
          </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button onClick={(e) => { e.stopPropagation(); onClose() }} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">Close</button>
        <button
          onClick={saveConfig}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          disabled={saving || !config.name || !config.systemPrompt || !config.firstQuestion || (config.suggestions?.filter(s => s.trim() !== '').length === 0)}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}