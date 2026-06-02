# GPTimage2 MVP Design

## Scope

Build a pure frontend React SPA for personal GPTimage2 image generation. The MVP includes local API configuration, text-to-image, image-to-image, output preview, history metadata, manual download, and File System Access API auto-save where supported.

## Architecture

The app keeps UI state in `App.tsx` and delegates stable behavior to focused helpers:

- `src/lib/apiClient.ts`: sends GPTimage2 requests, validates URL responses, handles timeout and network failures.
- `src/lib/storage.ts`: reads and writes API config and history metadata to `localStorage`.
- `src/lib/prompt.ts`: owns prompt merging rules.
- `src/lib/files.ts`: validates uploads, names files, downloads images, and writes auto-saved files.
- `src/lib/constants.ts`: owns model name, dimensions, size defaults, upload and timeout limits.

## Security

The API key is stored only in browser `localStorage`, hidden by default in the settings UI, and sent only to the user-configured Base URL. The app has no backend and cannot bypass browser CORS restrictions.

For local development against `https://cc-vibe.com`, Vite exposes a same-origin proxy at `http://127.0.0.1:5173/gptimage2-proxy`. This proxy runs only on the user's machine and forwards to `https://cc-vibe.com`; it exists because the service rejects browser CORS preflight requests from localhost.

`cc-vibe.com` returned a successful image response for `1024x1024` and an upstream error for `1320x2868` during integration testing, so the local implementation defaults to `1024x1024` while leaving the PRD's larger presets available for manual testing.

## Error And Async Handling

Generation uses a single active request controller. A new request aborts the previous one, stale results are ignored by request sequence, and the button is disabled during loading. Errors preserve existing input and any last successful image.

## Task Assignment

- Foundation: project setup, TypeScript, Vite, Vitest, ESLint.
- Core logic: API client, storage, prompt merging, file handling.
- UI: settings modal, tabs, forms, preview, history, save/download controls.
- Verification: unit tests, build, lint, and local browser checks.
