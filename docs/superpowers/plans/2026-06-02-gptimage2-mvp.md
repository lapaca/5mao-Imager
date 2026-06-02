# GPTimage2 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the GPTimage2 personal drawing tool MVP as a pure frontend SPA.

**Architecture:** Use React + Vite + TypeScript with a small set of focused helper modules for API calls, storage, prompt merging, and file handling. Keep `App.tsx` as the composition layer and avoid a backend.

**Tech Stack:** React, Vite, TypeScript, Vitest, Testing Library, ESLint, lucide-react.

---

### Task 1: Foundation

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `.gitignore`

- [x] Create Vite/React/TypeScript project configuration.
- [x] Install runtime and dev dependencies.
- [x] Add test setup for Vitest and Testing Library.

### Task 2: Core Logic

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/prompt.ts`
- Create: `src/lib/storage.ts`
- Create: `src/lib/files.ts`
- Create: `src/lib/apiClient.ts`
- Test: `src/lib/*.test.ts`

- [x] Write failing tests for prompt merging, localStorage persistence, file validation, and API request shape.
- [x] Implement the minimal core modules.
- [x] Verify the tests pass.

### Task 3: UI Shell

**Files:**
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`

- [x] Write failing UI tests for first visit, config prompt, settings save, and mode switching.
- [x] Implement the app shell, settings dialog, generation form, preview canvas, and history list.
- [x] Verify the UI tests pass.

### Task 4: Verification

**Commands:**
- `npm test`
- `npm run build`
- `npm run lint`
- `npm run dev -- --port 5173`

- [x] Run unit/component tests.
- [x] Run production build.
- [x] Run lint.
- [x] Open the local app in the in-app browser and verify key workflow surfaces.

### Task 5: Reliability Hardening

**Files:**
- Modify: `src/lib/apiClient.ts`
- Modify: `src/lib/apiClient.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

- [x] Add tests for API error messages and timeout behavior.
- [x] Add persisted-history coverage for expired image URLs.
- [x] Show a clear preview placeholder when a selected history image URL is unavailable or expired.
- [x] Re-run tests, build, lint, audit, and browser DOM verification.
