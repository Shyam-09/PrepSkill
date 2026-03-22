# PrepSkill Backend — Microservices Architecture

Production-ready Node.js microservices backend — TypeScript, **PostgreSQL + Prisma**, Redis, RabbitMQ. Inspired by TUF (Take U Forward).

---

## Project Structure

```
prepskill/
├── common/                         # @prepskill/common — shared npm package
│   └── src/
│       ├── auth/jwt.ts             # Token generators
│       ├── config/redis.ts         # Redis singleton
│       ├── errors/                 # AppError, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError
│       ├── middlewares/            # asyncHandler, errorHandler, protect
│       └── index.ts
│
├── user-service/        :5001      # Auth + User management
│   └── prisma/schema.prisma        # User model
├── content-service/     :5002      # Categories → Sheets → Topics → Problems
│   └── prisma/schema.prisma        # Category, Sheet, Topic, Problem
├── progress-service/    :5003      # Solved problems, streaks, completion %
│   └── prisma/schema.prisma        # UserProgress, SolvedProblem, SheetProgress
├── mock-service/        :5004      # Mock tests, auto-grading, leaderboards
│   └── prisma/schema.prisma        # MockTest, MockQuestion, MockAttempt, AnswerDetail
├── interview-service/   :5005      # Interview experiences with upvotes
│   └── prisma/schema.prisma        # InterviewExperience, InterviewRound, InterviewUpvote
├── analytics-service/   :5006      # Dashboard, user analytics, heatmaps
│   └── prisma/schema.prisma        # PlatformStats, UserAnalytics, ActivityByDay
│
├── infra/k8s/                      # Kubernetes manifests
│   ├── redisdepl.yaml
│   ├── rabbitmqdepl.yaml
│   ├── userdepl.yaml               # Deployment + Service + PostgreSQL per service
│   ├── contentdepl.yaml
│   ├── progressdepl.yaml
│   ├── mockdepl.yaml
│   ├── interviewdepl.yaml
│   ├── analyticsdepl.yaml
│   └── ingress.yaml
│
└── skaffold.yaml
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18 + TypeScript |
| Framework | Express 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 (one instance per service) |
| Cache | Redis 7 |
| Messaging | RabbitMQ 3 (topic exchange) |
| Auth | JWT (access 15m + refresh 7d) |
| Infra | Kubernetes + Skaffold |

---

## RabbitMQ Event Flow

```
content-service   ──► content.events / problem.created  ──► progress-service, analytics-service
content-service   ──► content.events / sheet.created    ──► analytics-service
progress-service  ──► progress.events / problem.solved  ──► analytics-service
mock-service      ──► mock.events / mock.completed      ──► analytics-service
interview-service ──► interview.events / interview.posted ──► analytics-service
```

---

## API Reference

### 🔐 User Service — `/api/auth` & `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login → access + refresh tokens |
| POST | /api/auth/refresh-token | — | New access token from refresh token |
| POST | /api/auth/logout | 🔒 | Blacklist token + clear refresh |
| GET | /api/users/me | 🔒 | Current user profile |
| GET | /api/users | 🔒 | List users (paginated + search) |
| GET | /api/users/:id | 🔒 | User by ID |

### 📚 Content Service — `/api/content`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/content/categories | — | All categories |
| POST/PUT/DELETE | /api/content/categories/:id | 🔒 | Manage categories |
| GET | /api/content/sheets?categoryId=&difficulty= | — | List sheets |
| POST/PUT/DELETE | /api/content/sheets/:id | 🔒 | Manage sheets |
| GET | /api/content/topics/sheet/:sheetId | — | Topics for a sheet |
| POST/PUT/DELETE | /api/content/topics/:id | 🔒 | Manage topics |
| GET | /api/content/problems?sheetId=&topicId=&difficulty=&tags= | — | List problems |
| POST/PUT/DELETE | /api/content/problems/:id | 🔒 | Manage problems |

### 📈 Progress Service — `/api/progress`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/progress/:userId | — | Full progress |
| GET | /api/progress/:userId/stats | — | Stats summary |
| GET | /api/progress/:userId/sheet/:sheetId | — | Sheet completion |
| POST | /api/progress/solve | 🔒 | Mark solved / revision |
| DELETE | /api/progress/solve/:problemId | 🔒 | Unmark problem |

### 🧪 Mock Service — `/api/mock`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/mock/tests | — | Tests list (no answers) |
| POST | /api/mock/tests | 🔒 | Create test |
| GET | /api/mock/leaderboard/:testId | — | Top scorers |
| POST | /api/mock/attempts/start | 🔒 | Start attempt |
| POST | /api/mock/attempts/:id/submit | 🔒 | Submit + auto-grade |
| GET | /api/mock/attempts/me | 🔒 | My attempts |
| GET | /api/mock/attempts/:id | 🔒 | Single attempt |

### 💬 Interview Service — `/api/interviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/interviews?company=&outcome=&yoe= | — | Browse posts |
| GET | /api/interviews/companies | — | Distinct companies |
| GET | /api/interviews/me | 🔒 | My posts |
| POST | /api/interviews | 🔒 | Share experience |
| PUT/DELETE | /api/interviews/:id | 🔒 | Edit / delete |
| POST | /api/interviews/:id/upvote | 🔒 | Toggle upvote |

### 📊 Analytics Service — `/api/analytics`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/analytics/dashboard | — | Platform-wide stats |
| GET | /api/analytics/leaderboard | — | Top solvers |
| GET | /api/analytics/leaderboard/sheet/:sheetId | — | Sheet leaderboard |
| GET | /api/analytics/users/:userId | 🔒 | User analytics |
| GET | /api/analytics/users/:userId/heatmap | 🔒 | Activity heatmap |

---

## Running Locally

```bash
# Start Minikube
minikube start

# Enable nginx ingress
minikube addons enable ingress

# Add to /etc/hosts
echo "$(minikube ip) prepskill.com" | sudo tee -a /etc/hosts

# Run with hot reload
skaffold dev
```

After startup, run migrations inside each pod:
```bash
kubectl exec -it <user-service-pod> -- npx prisma migrate deploy
```

---

## Using common package locally (without publishing)

Change each service's package.json temporarily:
```json
"@prepskill/common": "file:../common"
```
Then `npm run build` inside `common/` first, then `npm install` in each service.
