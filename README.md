# 🚀 PrepSkill — Full Stack Microservices Platform

PrepSkill is a **production-ready DSA interview preparation platform** inspired by TUF (Take U Forward).  
It is built using a **modern microservices architecture** with a scalable frontend and backend.

---

## 📌 Tech Stack

### Frontend
- React 18 + TypeScript  
- Tailwind CSS v3 (fully custom UI)  
- React Router v6  
- TanStack Query v5  
- Axios  
- Zustand  
- Lucide React  

### Backend
- Node.js + TypeScript  
- PostgreSQL + Prisma ORM  
- Redis (Caching)  
- RabbitMQ (Event-driven communication)  
- Kubernetes (Deployment)  

---

## 🏗️ Architecture Overview

PrepSkill follows a **microservices architecture**, where each service is independent and handles a specific responsibility.

Client (React App)
↓
NGINX Ingress
↓
| Auth Service (5001) |
| Content Service (5002) |
| Progress Service (5003) |
| Mock Service (5004) |
| Interview Service (5005) |
| Analytics Service (5006) |
    ↓

PostgreSQL (per service)
Redis + RabbitMQ


---

## 📂 Project Structure


prepskill/
├── common/ # Shared npm package (@prepskill/common)
│ ├── auth/ # JWT utilities
│ ├── config/ # Redis config
│ ├── errors/ # Custom error classes
│ ├── middlewares/ # Express middlewares
│ └── index.ts
│
├── user-service/ :5001
├── content-service/ :5002
├── progress-service/ :5003
├── mock-service/ :5004
├── interview-service/ :5005
├── analytics-service/ :5006
│
├── infra/k8s/ # Kubernetes configs
│ ├── redisdepl.yaml
│ ├── rabbitmqdepl.yaml
│ ├── ingress.yaml
│ └── service deployments
│
└── skaffold.yaml


---

## ⚡ Frontend Setup

```bash
cd frontend

npm install

cp .env.example .env.local
# Set:
# REACT_APP_API_URL=http://your-api-url

npm start        # Run dev server
npm run build    # Production build
🔗 API Gateway

All API calls go through

Services
/api/auth
/api/users
/api/content
/api/progress
/api/mock
/api/interviews
/api/analytics
🔐 Authentication
JWT-based authentication
Axios automatically:
Attaches access token
Refreshes expired tokens silently
📄 Frontend Pages
Route	Feature	Auth
/	Landing Page	Public
/login, /register	Auth	Public
/dashboard	Stats, progress, leaderboard	Required
/sheets	Browse sheets	Optional
/sheets/:id	Topics & problems	Optional
/mock	Mock tests list	Optional
/mock/:id	Timed test UI	Required
/mock/result/:id	Score & review	Required
/interviews	Experiences list	Optional
/interviews/:id	Experience detail	Optional
/analytics	Heatmaps, stats	Optional
/profile	User profile	Required
⚙️ Backend Setup (Per Service)
cd user-service   # or any service

npm install

# Setup environment variables
cp .env.example .env

# Run Prisma
npx prisma generate
npx prisma migrate dev

# Start service
npm run dev
🧠 Key Features
Microservices architecture (independent services)
Separate database per service
Event-driven communication using RabbitMQ
Redis caching for performance
Scalable Kubernetes deployment
Real-time analytics & leaderboards
Clean reusable common package
☸️ Deployment (Kubernetes)
# Apply all configs
kubectl apply -f infra/k8s/

# Or use Skaffold
skaffold dev
🛠️ Common Package (@prepskill/common)

Reusable utilities:

JWT handling
Error classes:
AppError
BadRequestError
NotFoundError
UnauthorizedError
Middleware:
asyncHandler
errorHandler
protect
📌 Future Improvements
Real-time leaderboard updates
AI-based interview feedback
Code execution engine
Notification system
