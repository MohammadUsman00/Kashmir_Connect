# KashmirConnect Frontend

Modular frontend app for KashmirConnect, built with Vite + vanilla JavaScript and connected to the backend API.

- `index.html` serves the original long-form responsive landing page.
- `app.html` serves the modular dashboard app connected to backend APIs.

## Structure

- `src/config` - environment config
- `src/lib` - shared HTTP helpers
- `src/state` - session/token state
- `src/services` - API modules by feature
- `src/views` - tab/view renderers
- `src/ui` - reusable UI helpers (toasts)
- `src/styles` - app styles

## Run Locally

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env`
3. Set backend URL:
   - `VITE_API_BASE_URL=http://localhost:3000/api/v1`
4. Start dev server:
   - `npm run dev`

Pages:
- Landing page: `http://localhost:5173/`
- Dashboard app: `http://localhost:5173/app.html`

## Build For Deployment

- `npm run build`
- Output will be in `dist/`

You can deploy `dist/` on Vercel, Netlify, Cloudflare Pages, or any static hosting.

## Deployment Notes

- Set `VITE_API_BASE_URL` to your deployed backend URL, for example:
  - `https://api.yourdomain.com/api/v1`
- On backend, set `APP_URL` to your frontend domain.
- You can set multiple frontend origins in backend using comma-separated values:
  - `APP_URL=https://yourapp.vercel.app,https://kashmirconnect.in`
