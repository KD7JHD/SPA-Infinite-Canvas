import React, { useState } from 'react'
import { JsonForm } from './JsonForm'
import { postToN8n } from '../lib/n8n'

interface InlineNodeFormCardProps {
  node: any
  screenX: number
  screenY: number
  scale: number
  onClose: () => void
  onUpdate: (patch: any) => void
}

export function InlineNodeFormCard({ node, screenX, screenY, scale, onClose, onUpdate }: InlineNodeFormCardProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const isFirstStep = (node.history?.length || 0) === 0
  const [firstStepInput, setFirstStepInput] = useState<string>('')
  const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([])

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const body = {
        step: (node.history?.length || 0) + 1,
        answers: isFirstStep
          ? {
              input: firstStepInput,
              selectedOptions: selectedSuggestions.map(idx => node.config?.suggestions?.[idx] || ''),
              customInput: firstStepInput,
              quickSelection: selectedSuggestions.map(idx => node.config?.suggestions?.[idx] || '').join(', '),
            }
          : formData,
        previous_form_schema: node.lastSchema,
        history: node.history || [],
        metadata: { nodeId: node.id },
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
        const storedAnswers = isFirstStep
          ? { 
              input: firstStepInput, 
              selectedOptions: selectedSuggestions.map(idx => node.config?.suggestions?.[idx] || ''),
              customInput: firstStepInput, 
              quickSelection: selectedSuggestions.map(idx => node.config?.suggestions?.[idx] || '').join(', ')
            }
          : formData
        onUpdate({ lastSchema: next.next_form_schema, history: [...(node.history || []), { answers: storedAnswers, schema: node.lastSchema }] })
      }
    } catch (err: any) {
      setBusy(false)
      setError('Network error: ' + err)
    }
  }

  const width = Math.min(520, Math.max(420, 420 * scale))

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY + 8}px`,
        width: `${width}px`,
        zIndex: 50,
      }}
      className="rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{node.config?.name || 'Node'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Inline Form</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">✕</button>
        </div>
        {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
        {isFirstStep ? (
          <div className="space-y-3">
            {node.config?.firstQuestion && (
              <div className="text-sm text-gray-800 dark:text-gray-200">{node.config.firstQuestion}</div>
            )}
            {/* Show suggestions as selectable checkboxes */}
            {(node.config?.suggestions || []).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Select options:</div>
                <div className="space-y-2">
                  {(node.config?.suggestions || []).map((opt: string, idx: number) => (
                    <label key={idx} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSuggestions([...selectedSuggestions, idx])
                          } else {
                            setSelectedSuggestions(selectedSuggestions.filter(i => i !== idx))
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter the numbers you choose or write your own ideas.</label>
              <textarea
                value={firstStepInput}
                onChange={(e) => setFirstStepInput(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                placeholder="e.g., 1,3,5 or describe your idea..."
              />
            </div>
          </div>
        ) : node.lastSchema ? (
          <JsonForm schema={node.lastSchema} data={formData} onChange={setFormData} />
        ) : (
          <div className="text-xs text-gray-600 dark:text-gray-300">No form schema available yet.</div>
        )}
        <button
          onClick={submit}
          disabled={busy}
          className="mt-3 w-full px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? 'Sending…' : node?.lastSchema?.ui?.submitLabel || 'Submit'}
        </button>
      </div>
    </div>
  )
}
