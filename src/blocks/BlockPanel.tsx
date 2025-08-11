import { useProject } from '../state/ProjectContext'

export function BlockPanel() {
  const { addNode } = useProject()
  return (
    <div>
      <h2 className="font-medium mb-2">Building blocks</h2>
      <button
        onClick={() => addNode({ blockId: 'lyricist', x: 200, y: 120, history: [], lastSchema: null })}
        className="w-full text-left px-3 py-2 rounded border hover:bg-gray-50"
      >
        🎵 Expert Lyricist
      </button>
      <p className="text-xs text-gray-500 mt-2">Drag and drop coming soon. Click to add for now.</p>
    </div>
  )
}