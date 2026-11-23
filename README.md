# Gym Tracker

Log workouts and track strength progress.

| Folder    | Stack                                                         |
|-----------|---------------------------------------------------------------|
| `client/` | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide    |
| `server/` | Express 5, TypeScript, Mongoose (MongoDB)                     |

## Prerequisites

- Node.js 20+
- A MongoDB database: either a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local install
  (`brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`)

## Run locally

```bash
# 1. API (http://localhost:4000)
cd server
cp .env.example .env      # set MONGODB_URI
npm install
npm run dev

# 2. Web app (http://localhost:3000), in a second terminal
cd client
cp .env.example .env.local
npm install
npm run dev
```

Check the API: `curl http://localhost:4000/api/health` → `{"status":"ok","db":"connected"}`
