# Component Guidelines — Infinite Canvas SPA

> Purpose: Define consistent, accessible, and performant component patterns for this project. These rules are binding for new code and preferred for refactors.

## 0) Scope & Component Types

- **UI Primitives** (`src/shared/ui`): Stateless, accessible building blocks (buttons, dialogs, inputs). Style with Tailwind; behavior from Headless UI where applicable.
- **Feature Components** (`src/blocks`, `src/features/*`): Compose primitives, minimal side effects, accept domain models via props.
- **Canvas Components** (`src/canvas`): **Render-only** React Konva nodes (Stage, Layers, Shapes). No auth, API, or form logic.
- **Form Components** (`src/forms`): JSONForms schemas, UISchemas, and custom renderers; validation via Ajv only.

## 1) Files, Names & Exports

- **One component per file**; default export only for route/page-level. Prefer **named exports** for all others.
- **File names**: `PascalCase.tsx` for components, `useThing.ts` for hooks, `thing.types.ts` for shared types.
- **Index barrels** in folders to expose public surface; avoid deep imports across features.
- **Tests**: `ComponentName.test.tsx` next to source. **Stories (optional)**: `ComponentName.stories.tsx`.

## 2) Props & Types

- Define `Props` as **TypeScript interfaces**; no `any` at public boundaries.
- **Inputs are controlled** unless read‑only. Avoid hidden internal state for critical values.
- **Events** use the `onX` naming convention and are **typed**; do not leak synthetic events beyond the component.
- **Avoid Boolean traps**: prefer union types or discriminated unions for modes.
- Provide **sensible defaults** via default props or initializer patterns.

```tsx
export interface ToolbarProps {
  mode: 'select' | 'pan' | 'draw';
  onModeChange?: (mode: ToolbarProps['mode']) => void;
}

```

## 3) State & Effects

- Prefer **local state** (`useState`, `useReducer`) for UI concerns; **do not** store server data in contexts.
- Wrap remote interactions in **service hooks** (e.g., `useGitHubFile`) that map DTOs → domain models.
- Effects are **idempotent** and cancelable; always include stable deps.

## 4) Styling & Theming (Tailwind)

- Use design tokens via Tailwind config; avoid arbitrary values unless justified.
- Co-locate small component styles in the component file. Extract complex patterns to `src/styles`.
- Use responsive & state variants (`sm:`, `md:`, `hover:`, `aria-pressed:`). Support dark mode via `[data-theme]` attribute.

## 5) Performance Guidelines

- **Measure before optimizing** (React Profiler). Memoization is optional and should not affect correctness.
- Prefer **`useMemo`/`useCallback` sparingly** for expensive calcs or prop stability on hot paths. Avoid premature optimization.
- Defer heavy work with `requestAnimationFrame`/`setTimeout` when user-perceived latency matters.
- Lists: virtualize when item count is large.

### 5.1 React Konva Specific

- Keep the **Stage** size constrained to the viewport; avoid mega-stages.
- Minimize **Layers**; disable event processing on non-interactive layers with `layer.listening(false)`.
- **Batch draws** during continuous input with `layer.batchDraw()`.
- Avoid per-shape listeners when possible; delegate at higher levels.
- Cache expensive nodes (images, complex shapes) thoughtfully; clear caches when invalidated.

### 5.2 JSONForms Specific

- Provide a **custom Ajv instance** to control defaults, formats, and keywords.
- Use **custom renderers** for domain-specific UI. Keep them presentation-first and headless where possible.
- Do not duplicate validation in components; rely on schema + Ajv errors. Surface messages near fields.

## 6) Error Handling

- Components fail **visibly and recoverably**: empty/Loading/Error states with retry where applicable.
- Convert low-level errors to a **typed error taxonomy** at service boundaries.
- Never leak raw exceptions to the UI; log with context and correlation IDs when available.

## 8) Testing (React Testing Library)

- Test **behavior, not implementation**. Prefer `user-event` over low-level events.
- Query priority: role → label text → placeholder → text → testid (last resort).
- Cover accessibility basics: keyboard tab order, focus traps, ARIA attributes in critical components.
- Canvas: test via higher-level interactions (keyboard shortcuts, toolbar buttons) and serialized model output.

```tsx
// Example: dialog accessibility
await user.click(screen.getByRole('button', { name: /new block/i }));
expect(screen.getByRole('dialog', { name: /create block/i })).toBeInTheDocument();
await user.keyboard('{Escape}');
expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

```

## 9) Documentation & JSDoc

- Each exported component includes a **JSDoc header**: purpose, constraints, and a11y notes.
- Use `@remarks` for architectural constraints (e.g., "render-only; no API calls").

```tsx
/**
 * Toolbar controlling canvas modes.
 * @remarks Render-only; emits `onModeChange`. No data fetching.
 */
export function Toolbar(props: ToolbarProps) { /* ... */ }

```

## 10) Quick Reference Rules

- Co-locate logic and UI by feature; keep public surfaces small.
- Keep components pure; push side effects to hooks/services.
- Provide keyboard and screen-reader support for custom UI.
- Map DTOs to domain types at boundaries.
- Co-locate logic and UI by feature; keep public surfaces small.
- Keep components pure; push side effects to hooks/services.
- Provide keyboard and screen-reader support for custom UI.
- Map DTOs to domain types at boundaries.
- Pass only processed, domain-level data to components instead of raw API responses.
- Expose essential state through props and callbacks so consumers can control behavior.
- Use `useMemo`/`useCallback` intentionally for performance-critical calculations or prop stability, ensuring correctness first.
- Delegate Konva event handling to higher-level nodes when possible rather than attaching listeners to each shape.# Component Guidelines — Infinite Canvas SPA

> Purpose: Define consistent, accessible, and performant component patterns for this project. These rules are binding for new code and preferred for refactors.
> 

## 0) Scope & Component Types

- **UI Primitives** (`src/shared/ui`): Stateless, accessible building blocks (buttons, dialogs, inputs). Style with Tailwind; behavior from Headless UI where applicable.
- **Feature Components** (`src/blocks`, `src/features/*`): Compose primitives, minimal side effects, accept domain models via props.
- **Canvas Components** (`src/canvas`): **Render-only** React Konva nodes (Stage, Layers, Shapes). No auth, API, or form logic.
- **Form Components** (`src/forms`): JSONForms schemas, UISchemas, and custom renderers; validation via Ajv only.

## 1) Files, Names & Exports

- **One component per file**; default export only for route/page-level. Prefer **named exports** for all others.
- **File names**: `PascalCase.tsx` for components, `useThing.ts` for hooks, `thing.types.ts` for shared types.
- **Index barrels** in folders to expose public surface; avoid deep imports across features.
- **Tests**: `ComponentName.test.tsx` next to source. **Stories (optional)**: `ComponentName.stories.tsx`.

## 2) Props & Types

- Define `Props` as **TypeScript interfaces**; no `any` at public boundaries.
- **Inputs are controlled** unless read‑only. Avoid hidden internal state for critical values.
- **Events** use the `onX` naming convention and are **typed**; do not leak synthetic events beyond the component.
- **Avoid Boolean traps**: prefer union types or discriminated unions for modes.
- Provide **sensible defaults** via default props or initializer patterns.

```tsx
export interface ToolbarProps {
  mode: 'select' | 'pan' | 'draw';
  onModeChange?: (mode: ToolbarProps['mode']) => void;
}

```

## 3) State & Effects

- Prefer **local state** (`useState`, `useReducer`) for UI concerns; **do not** store server data in contexts.
- Wrap remote interactions in **service hooks** (e.g., `useGitHubFile`) that map DTOs → domain models.
- Effects are **idempotent** and cancelable; always include stable deps.

## 4) Styling & Theming (Tailwind)

- Use design tokens via Tailwind config; avoid arbitrary values unless justified.
- Co-locate small component styles in the component file. Extract complex patterns to `src/styles`.
- Use responsive & state variants (`sm:`, `md:`, `hover:`, `aria-pressed:`). Support dark mode via `[data-theme]` attribute.

## 5) Performance Guidelines

- **Measure before optimizing** (React Profiler). Memoization is optional and should not affect correctness.
- Prefer **`useMemo`/`useCallback` sparingly** for expensive calcs or prop stability on hot paths. Avoid premature optimization.
- Defer heavy work with `requestAnimationFrame`/`setTimeout` when user-perceived latency matters.
- Lists: virtualize when item count is large.

### 5.1 React Konva Specific

- Keep the **Stage** size constrained to the viewport; avoid mega-stages.
- Minimize **Layers**; disable event processing on non-interactive layers with `layer.listening(false)`.
- **Batch draws** during continuous input with `layer.batchDraw()`.
- Avoid per-shape listeners when possible; delegate at higher levels.
- Cache expensive nodes (images, complex shapes) thoughtfully; clear caches when invalidated.

### 5.2 JSONForms Specific

- Provide a **custom Ajv instance** to control defaults, formats, and keywords.
- Use **custom renderers** for domain-specific UI. Keep them presentation-first and headless where possible.
- Do not duplicate validation in components; rely on schema + Ajv errors. Surface messages near fields.

## 6) Error Handling

- Components fail **visibly and recoverably**: empty/Loading/Error states with retry where applicable.
- Convert low-level errors to a **typed error taxonomy** at service boundaries.
- Never leak raw exceptions to the UI; log with context and correlation IDs when available.

## 8) Testing (React Testing Library)

- Test **behavior, not implementation**. Prefer `user-event` over low-level events.
- Query priority: role → label text → placeholder → text → testid (last resort).
- Cover accessibility basics: keyboard tab order, focus traps, ARIA attributes in critical components.
- Canvas: test via higher-level interactions (keyboard shortcuts, toolbar buttons) and serialized model output.

```tsx
// Example: dialog accessibility
await user.click(screen.getByRole('button', { name: /new block/i }));
expect(screen.getByRole('dialog', { name: /create block/i })).toBeInTheDocument();
await user.keyboard('{Escape}');
expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

```

## 9) Documentation & JSDoc

- Each exported component includes a **JSDoc header**: purpose, constraints, and a11y notes.
- Use `@remarks` for architectural constraints (e.g., "render-only; no API calls").

```tsx
/**
 * Toolbar controlling canvas modes.
 * @remarks Render-only; emits `onModeChange`. No data fetching.
 */
export function Toolbar(props: ToolbarProps) { /* ... */ }

```

## 10) Quick Reference Rules

- Co-locate logic and UI by feature; keep public surfaces small.
- Keep components pure; push side effects to hooks/services.
- Provide keyboard and screen-reader support for custom UI.
- Map DTOs to domain types at boundaries.
- Co-locate logic and UI by feature; keep public surfaces small.
- Keep components pure; push side effects to hooks/services.
- Provide keyboard and screen-reader support for custom UI.
- Map DTOs to domain types at boundaries.
- Pass only processed, domain-level data to components instead of raw API responses.
- Expose essential state through props and callbacks so consumers can control behavior.
- Use `useMemo`/`useCallback` intentionally for performance-critical calculations or prop stability, ensuring correctness first.
- Delegate Konva event handling to higher-level nodes when possible rather than attaching listeners to each shape.