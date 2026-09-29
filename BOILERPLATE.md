### Boilerplate Setup Steps

**Monorepo**
```bash
mkdir rc-fishing && cd rc-fishing
npm init -y
npm install -D concurrently
```

Added root .gitignore (ignoring node_modules/, .env, *.db, dist/).  
Updated root package.json scripts with "dev": "concurrently "npm run dev --prefix frontend" "npm run dev --prefix backend"".

**Frontend (Vite + R3F + Tailwind)**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install three @types/three @react-three/fiber @react-three/drei
npm install @tailwindcss/vite
```

Updated frontend/vite.config.ts to include Tailwind plugin and proxy /api to http://localhost:3001.  
Replaced frontend/src/index.css with @import "tailwindcss"; and basic html/body reset.  
Added diagnostic health-check fetch to frontend/src/App.tsx.

**Backend (Express + TS)**
```bash
mkdir backend && cd backend
npm init -y
npm install express cors dotenv
npm install -D typescript @types/express @types/cors @types/node tsx
npx tsc --init
mkdir src
```

Action: Added "type": "module" and "dev": "tsx watch src/server.ts" to backend/package.json.  
Action: Updated backend/tsconfig.json to use "module": "NodeNext", "moduleResolution": "NodeNext", and "rootDir": "./src".  
Action: Created backend/src/server.ts with basic Express setup, CORS, and /api/health endpoint on port 3001.

**Running the Project**
```bash
npm run dev
```