# Architecture Guide — SPA Infinite Canvas

## 1) Goals & Non‑Goals

**Goals**

- Maintainable, modular infinite canvas application
- High performance (Core Web Vitals green)
- Moible responsive UI
- Secure authentication (GitHub OAuth with PKCE)
- Seamless GitHub integration for persistence

## 2) Architectural Principles

- **Separation of concerns**: Canvas rendering, form logic, API calls, and UI components are independent layers.
- **Feature-first modularity**: Organize by features like `canvas`, `forms`, `blocks`.
- **Typed boundaries**: TypeScript with `strict: true` for all public interfaces.
- **Performance as a requirement**: Budget enforcement for JS payloads and rendering times.

## 3) Tech Stack

- **UI Framework**: React 18.3.1 + React DOM
- **Language**: TypeScript 5.5.4
- **Canvas**: Konva 9.3.16 + React Konva 18.2.10
- **Forms**: JSONForms Core/React/Vanilla, Ajv validator
- **Styling**: Tailwind CSS 3.4.10, PostCSS, Autoprefixer, Headless UI 2.2.0
- **Auth & API**: Octokit (GitHub API), OAuth PKCE flow
- **Build Tool**: Vite 5.4.2 with Vite React Plugin
- **External Services**: GitHub API, n8n webhooks, GitHub Pages deployment

## 4) High-Level Architecture

```
UI (React components) ──> Feature modules (canvas, forms, blocks) ──> Services (GitHub API, n8n webhook)
           ^                                │                           │
           └───────── State (Context) ─────┴─────────────── API layer ┘

```

## 5) Module Boundaries & Folder Structure

```
src/
  app/                # App shell, providers, router, layout
  blocks/             # Block components and logic
  canvas/             # Infinite canvas rendering, zoom/pan, Konva integration
  forms/              # JSONForms-based dynamic forms
  lib/                # Utilities, formatters, helpers
  state/              # Global context providers
  services/           # GitHub API, OAuth, n8n integration
  styles/             # Tailwind config, tokens
  config.ts           # Environment config

```

- Each feature folder owns its internals and exposes only through its index file.

## 6) State Management

- **Local/UI state** in components for transient data
- **Global state** in `state/` for auth, theme, and shared configuration
- **Server state** (GitHub data, webhook responses) handled via async services and cached minimally

## 7) API Layer

- Single Octokit instance configured for GitHub API calls
- OAuth PKCE for secure authentication
- Webhook integrations with n8n for dynamic form processing
- Map DTOs to internal types before use in components

## 8) Styling & Theming

- Unified & clean design
- Tailwind CSS utility-first approach
- Dark mode via `data-theme` attribute
- Design tokens for colors, spacing, typography in `/styles/`

## 9) Performance Budgets

- Initial JS payload ≤ 200 KB gzip
- LCP < 2.5s, CLS < 0.1, INP < 200ms
- Optimize canvas rendering with Konva layering, requestAnimationFrame batching

## 10) Testing Strategy

- Unit: utility functions and hooks
- Component: canvas tools, form rendering
- Integration: GitHub API flows, canvas interactions
- E2E: core user flows (login, block creation, form submission)