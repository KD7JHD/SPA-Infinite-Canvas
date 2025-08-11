import { Stage, Layer, Group, Rect, Text } from 'react-konva'
import { useRef, useState } from 'react'
import { useProject } from '../state/ProjectContext'
import { JsonForm } from '../forms/JsonForm'
import { postToN8n } from '../lib/n8n'

export function Canvas() {
  const { project, updateNode } = useProject()
  const stageRef = useRef<any>(null)
  const [scale, setScale] = useState(1)

  const onWheel = (e: any) => {
    e.evt.preventDefault()
    const scaleBy = 1.05
    const oldScale = scale
    const pointer = stageRef.current.getPointerPosition()
    const mousePointTo = {
      x: (pointer.x - stageRef.current.x()) / oldScale,
      y: (pointer.y - stageRef.current.y()) / oldScale,
    }
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    setScale(newScale)
    stageRef.current.scale({ x: newScale, y: newScale })
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    stageRef.current.position(newPos)
    stageRef.current.batchDraw()
  }

  return (
    <Stage ref={stageRef} width={window.innerWidth} height={window.innerHeight - 48} onWheel={onWheel} draggable>
      <Layer>
        {project.nodes.map((n) => (
          <NodeView key={n.id} id={n.id} x={n.x} y={n.y} history={n.history} lastSchema={n.lastSchema} />
        ))}
      </Layer>
    </Stage>
  )
}

function NodeView({ id, x, y, history, lastSchema }: any) {
  const { updateNode } = useProject()
  const [pos, setPos] = useState({ x, y })
  const [formData, setFormData] = useState<any>({})
  const [schema, setSchema] = useState<any>(lastSchema || {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    title: 'Start Lyricist',
    properties: { topic: { type: 'string', title: 'Song topic' } },
    required: ['topic'],
    ui: { end: false, submitLabel: 'Continue' }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    const body = {
      step: (history?.length || 0) + 1,
      answers: formData,
      previous_form_schema: schema,
      history: history || [],
      metadata: { nodeId: id }
    }
    const res = await postToN8n(body)
    setBusy(false)
    if (!res.ok) {
      setError(res.json?.error || 'Request failed')
      return
    }
    const next = res.json
    if (next?.next_form_schema) {
      setFormData({})
      setSchema(next.next_form_schema)
      updateNode(id, { lastSchema: next.next_form_schema, history: [...(history || []), { answers: formData, schema }] })
    }
  }

  return (
    <Group x={pos.x} y={pos.y} draggable onDragEnd={(e) => {
      const nx = e.target.x(), ny = e.target.y()
      setPos({ x: nx, y: ny })
      updateNode(id, { x: nx, y: ny })
    }}>
      <Rect width={360} height={320} cornerRadius={16} fill="#ffffff" shadowBlur={8} stroke="#e5e7eb" />
      <Text text="🎵 Lyricist" x={12} y={12} fontStyle="bold" fontSize={16} />
      <foreignObject x={12} y={40} width={336} height={260}>
        <div style={{ width: '336px', height: '260px', overflow: 'auto' }}>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <JsonForm schema={schema} data={formData} onChange={setFormData} />
          <button onClick={submit} disabled={busy} className="mt-2 w-full px-3 py-2 rounded bg-indigo-600 text-white">
            {busy ? 'Sending…' : (schema?.ui?.submitLabel || 'Submit')}
          </button>
          {schema?.ui?.end && <div className="text-sm text-green-700 mt-2">Completed</div>}
        </div>
      </foreignObject>
    </Group>
  )
}