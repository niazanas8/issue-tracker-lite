# 🐞 Issue Tracker Lite

![Bug Tracker Cover](https://www.softwaresuggest.com/blog/wp-content/uploads/2019/08/s-blog-3-01.jpg)

A full-stack bug/issue tracking system built with **MongoDB, Express, React, and Node.js (MERN)**.  
Developers can create tickets for projects, admins can manage progress, and everyone can collaborate — now with **light/dark mode** and an **admin ban feature**.

---

## 🌐 Live Links
- **Frontend (Vercel):** [Live Demo](https://issue-tracker-lite-weld.vercel.app/)
- **Backend (Render):** [API](https://issue-tracker-lite-1.onrender.com)

---

## ✨ Features
- 🔐 **Authentication** & password encryption with Bcrypt
- 🔑 **Role-based authorization** using JWT
- 👤 **Admin controls** (ban users by IP, manage projects/tickets)
- 🧾 Projects & tickets (status, priority, type, ETA, dev assignment)
- 💬 Ticket comments
- 📊 Dashboard with charts and recent activity
- 🌗 **Light/Dark theme** toggle with MUI
- 🧰 Global state management with Redux Toolkit
- 📱 Fully responsive design (Flexbox + Grid)

---

## 🛠️ Technologies Used
| Technology         | Usage                                |
|--------------------|--------------------------------------|
| React Router DOM   | Navigation & Routing                 |
| Material UI (MUI)  | UI Components, Styles & Icons        |
| Redux Toolkit      | Global State Management              |
| Node.js & Express  | REST API Backend                     |
| MongoDB + Mongoose | Database & ODM                       |
| Bcrypt             | Password Encryption                  |
| JSON Web Tokens    | Authentication & Authorization       |
| Axios              | HTTP Requests                        |
| TypeScript (Client)| Type Safety & Error Detection        |
| Render             | Backend Hosting                      |
| Vercel             | Frontend Hosting                     |

---

## ⚙️ Running Locally

### Run the Client
1. Clone the repo and navigate to `Client/`.
2. Install dependencies:
   ```bash
   npm install
