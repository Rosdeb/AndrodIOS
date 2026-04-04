# IconForge Studio

Project structure:

- `backend/` Express API and server
- `website/` public icon generator UI
- `admin/` admin analytics dashboard UI
- root docs and planning files

## What Is Included
- Express server in `backend/`
- Public landing page and live editor
- Admin dashboard page
- Public project APIs
- Export manifest APIs for Android and iOS icon sets
- Analytics event tracking
- Protected admin dashboard APIs
- Seed data for testing dashboard responses

## Website Routes
- `/` public homepage + icon editor
- `/admin` admin analytics dashboard
- `/api/health` health check

## API Structure

### Public APIs
- `GET /api/health`
- `GET /api/public/presets`
- `POST /api/public/projects`
- `GET /api/public/projects/:projectId`
- `PATCH /api/public/projects/:projectId`
- `GET /api/public/projects/:projectId/preview`
- `POST /api/public/projects/:projectId/export`
- `POST /api/public/events`

### Admin APIs
All admin routes require header:

`x-admin-key: dev-admin-key`

- `GET /api/admin/overview`
- `GET /api/admin/countries`
- `GET /api/admin/funnel`
- `GET /api/admin/features`
- `GET /api/admin/activity`
- `GET /api/admin/exports`

## Run Locally

1. Install dependencies:

```bash
cd backend
npm install
```

2. Start the backend:

```bash
npm run dev
```

3. Open:

`http://localhost:4000/`

Admin dashboard:

`http://localhost:4000/admin`

## Example Create Project Request

```json
{
  "name": "Orbit Wallet",
  "platforms": ["android", "ios"],
  "icon": {
    "assetUrl": "/uploads/orbit-wallet.svg",
    "foregroundColor": "#ffffff",
    "backgroundColor": "#0f172a",
    "gradient": ["#0f172a", "#2563eb"],
    "zoom": 1.15,
    "padding": 18,
    "shape": "rounded-square"
  }
}
```

## Example Export Request

`POST /api/public/projects/:projectId/export`

```json
{
  "platforms": ["android", "ios"],
  "country": "Bangladesh",
  "deviceType": "desktop"
}
```

## Notes
- Data is currently stored in memory for fast prototyping.
- The next backend step should be adding a real database and file storage.
- Export responses currently return a manifest and file plan, not real generated images yet.
