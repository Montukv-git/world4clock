# world4clock

Simple Vite + React app showing four timezones on a single page.

## Deploy

This repo is preconfigured for GitHub Actions. Push to `main` and the workflow will build and publish to GitHub Pages.

Notes:
- The Action uses `dist` as the publish directory (Vite default).
- If API fetches for authoritative time fail (sandboxed environments), the app falls back to local system time and shows `Unsynced`.
- To run locally:
  - `npm install`
  - `npm run dev`
  - Open `http://localhost:5173`

### MKVtech 2025
