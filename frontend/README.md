# PrepSkill Frontend

React + TypeScript + Tailwind CSS frontend for the PrepSkill microservices backend.

## Stack
- React 18 + TypeScript
- Tailwind CSS v3 (no component library — fully custom)
- React Router v6 · TanStack Query v5 · Axios · Zustand · Lucide React

## Quick start
```bash
npm install
cp .env.example .env.local   # set REACT_APP_API_URL
npm start                     # dev server
npm run build                 # production build
```

## Pages
| Route | Feature | Auth |
|---|---|---|
| `/` | Landing page | Public |
| `/login` `/register` | Auth | Public |
| `/dashboard` | Stats, sheet progress, leaderboard | Required |
| `/sheets` | Browse + filter sheets | Optional |
| `/sheets/:id` | Topics + problems accordion, mark solved | Optional |
| `/mock` | Mock tests list | Optional |
| `/mock/:id` | Timed test-taking UI | Required |
| `/mock/result/:id` | Score + question review | Required |
| `/interviews` | Browse + filter experiences | Optional |
| `/interviews/:id` | Full experience detail | Optional |
| `/analytics` | Heatmap, diff ring, leaderboard | Optional |
| `/profile` | User stats, sheet progress, solved list | Required |

## Services
All calls route through nginx ingress at `REACT_APP_API_URL`:
`/api/auth` `/api/users` `/api/content` `/api/progress` `/api/mock` `/api/interviews` `/api/analytics`

Axios auto-attaches JWT and silently refreshes expired access tokens.
