# 🐞 Issue Tracker Lite

![Bug Tracker Cover](https://www.softwaresuggest.com/blog/wp-content/uploads/2019/08/s-blog-3-01.jpg)

A full-stack bug/issue tracking app built with **MongoDB + Express + React + Node.js (MERN)**.  
Create projects, file tickets, assign devs, track status, and comment — now with **light/dark mode** and a simple **admin ban** tool.

---

### 🌐 Live
- **Frontend (Vercel):** [Issue Tracker Lite](https://issue-tracker-lite-weld.vercel.app/)  
- **Backend (Render API):** [Issue Tracker API](https://issue-tracker-lite-1.onrender.com)

---

## ✨ Features

- 🔐 JWT auth (register/login), bcrypt password hashing
- 👥 Role-based routes (admin/developer)
- 🧾 Projects & tickets (priority, status, type, ETA, assigned devs)
- 💬 Ticket comments
- 📊 Dashboard: recent activity, ticket distribution, project performance
- 🌗 **Light/Dark theme** with persistent preference
- 🛡️ Admin: ban abusive IPs
- 🧰 Redux Toolkit global state
- 📱 Responsive UI (Material UI + Flex/Grid)
- 🧪 TypeScript client

---

## 🗂️ Project Structure
---
├── Client/ # React + TS + Redux + MUI
│ ├── public/
│ └── src/
│ ├── components/ # Header, menus, profile, etc.
│ ├── containers/ # Main layout
│ ├── features/ # Redux slices
│ ├── pages/ # Login, Dashboard, Tickets, Admin
│ ├── theme/ # AppThemeProvider (light/dark)
│ ├── service.ts # front-end API calls
│ └── utils/ # helpers (cookies, formatters)
└── Server/ # Express + Mongoose API
├── models/ # Users, Projects, Tickets, BannedIP
├── .env # server env vars (not committed)
└── index.js # API routes & startup
---

## ⚙️ Prerequisites

- **Node.js** ≥ 18
- **MongoDB Atlas** (or a local Mongo instance)
- A **MongoDB connection string** with your current IP allow-listed  
  _(Atlas → Network Access → Add IP → `0.0.0.0/0` for public dev or your current IP for stricter security)_

---

## 🔑 Environment Variables

### Server (`Server/.env`)

MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority&appName=<clusterName>
JWTSECRET=supersecret_dev_key
PORT=3001

> You can also use `MONGODB_URI` or `MONGODBURI` — the server accepts any of those names.

### Client (`Client/.env.development.local` or `Client/.env`)
REACT_APP_LOCAL_API_URL=http://localhost:3001/


> In production (Vercel), set `REACT_APP_LOCAL_API_URL` to your **Render API** URL, e.g.  
> https://issue-tracker-lite-1.onrender.com

---

## 🧪 Run Locally

### 1) Start the API
cd Server
npm install
npm run dev       # nodemon index.js
# or
npm start         # node index.js
Visit: http://localhost:3001/ → should show “Issue Tracker API ✅”
Health: http://localhost:3001/health
Ping: http://localhost:3001/pingServer

2) Start the Client
Copy code
cd Client
npm install
npm start
Visit: http://localhost:3000/issue-tracker-lite/
---
🚀 Deploy
---
###Backend (Render)
Root Directory: Server
Build Command: npm install
Start Command: node index.js

Environment (Render dashboard → Environment):

MONGO_URI = your Atlas URI

JWTSECRET = your secret

PORT = 3001 (Render will set a port; using process.env.PORT is already handled)

After saving, Manual Deploy → Clear build cache & deploy.
Test: https://issue-tracker-lite-1.onrender.com, /health, /pingServer.

Frontend (Vercel)
Project = Client/ (monorepo)

Root Directory: Client

Build Command: (Vercel auto) or npm run build

Output Directory: build

Environment Variables:

REACT_APP_LOCAL_API_URL=https://issue-tracker-lite-1.onrender.com

Base path: App uses basename="/issue-tracker-lite" in index.tsx.
Ensure your links respect that base path.

---
🔌 API Endpoints (selection)
---
Auth

POST /register { email, password }

POST /login { email, password }

GET /isUserAuth (JWT required)

GET /userSecurity (ban check)

GET /pingServer → "Server Is Up!"

GET /health → server + mongo status

Projects (JWT required)

POST /createProject { title, description }

GET /getAllProjects

Tickets (JWT required)

POST /createTicket { title, description, project, priority, type, estimatedTime }

GET /getAllTickets

POST /updateStatus { id, status }

POST /addDevs { id, newDev }

POST /addComment { id, comment }

Admin (JWT + admin role)

GET /getUsers

POST /banUser { ip }

Send JWT in headers:

makefile
Copy code
x-access-token: <token>
email: <user email>
---
🌓 Theme Toggle
---
Client/src/theme/AppThemeProvider.tsx provides ColorModeContext & MUI theme.

Client/src/components/Header.tsx includes a brightness icon button to toggle modes.

Preference is stored in localStorage (prefers-color).
---
🧭 Scripts
---
Client
npm start – dev server
npm run build – production build
npm test – (if configured)

Server
npm run dev – nodemon
npm start – node
---
🧩 Notes & Tips
---
If the frontend shows a loading screen for a long time:
  Ensure the API URL in REACT_APP_LOCAL_API_URL is reachable (CORS OK) and /pingServer returns text.
If Render root says “Cannot GET /”:
  Your service might be pointed to the repo root. Set Root Directory to Server or start with node Server/index.js.
If Mongo cannot connect on Render:
  Double-check MONGO_URI and your Atlas IP allow list.
---
📜 License
---
MIT © Anas Niaz
---

🙌 Acknowledgements
---
Inspired by classic MERN bug trackers; rebuilt and customized with TypeScript, MUI, and theme switching.
---
