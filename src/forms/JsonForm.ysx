import { JsonForms } from '@jsonforms/react'
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers'
import Ajv2020 from 'ajv/dist/2020'
import { useMemo } from 'react'

export function JsonForm({ schema, data, onChange }: { schema: any; data: any; onChange: (data: any) => void }) {
  const ajv = useMemo(() => new Ajv2020({ allErrors: true, strictSchema: false }), [])
  return (
    <div className="p-2">
      <JsonForms
        schema={schema}
        data={data}
        renderers={vanillaRenderers}
        cells={vanillaCells}
        ajv={ajv as any}
        onChange={({ data }) => onChange(data)}
      />
    </div>
  )
}