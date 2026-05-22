# Finance-Management
RWDM (Rural Woman Development Mission) is a modern web-based finance management platform for chit-fund savings groups. It enables group creation, monthly and partial payment tracking, double-entry ledgers, real-time analytics, payment reminders, notifications, member rankings, and a responsive dark-mode UI.

# 💰 FinanceHub — Group Financial Management System
# 🌾 RWDM — Rural Woman Development Mission
### Group-Based Financial Management System
A full-stack web application for managing group-based savings/chit-fund-style financial groups with analytics, rankings, and predictive insights.
> A full-stack web application built to empower rural women's self-help groups (SHGs) by digitizing savings collection, tracking contributions, managing group ledgers, and providing real-time financial analytics.
## 🚀 Quick Start
---
## 📌 Project Description
**RWDM (Rural Woman Development Mission)** is a modern, web-based finance management platform designed specifically for managing chit-fund-style savings groups. It enables administrators to:
- Create and manage multiple savings groups with custom durations and contribution amounts
- Track monthly payments per member — including **partial payments**
- Maintain a double-entry group ledger with accurate running balances
- View real-time analytics: collection rates, achievement percentages, and trends
- Send payment reminders and receive notifications
- Generate member and group performance rankings
The system is built with a clean dark-mode UI, premium typography, and responsive design — accessible from any device.
---
## ✨ Key Features
|
 Feature 
|
 Description 
|
|
---------
|
-------------
|
|
 🔐 
**
Authentication
**
|
 JWT-based login with Admin role control. Only Admins can register and manage the system. 
|
|
 👥 
**
Group Management
**
|
 Create groups with name, monthly contribution, duration, start date, and optional custom savings target. 
|
|
 👤 
**
Member Management
**
|
 Add/remove members per group. Auto-generates contribution records for all months. 
|
|
 💳 
**
Contributions
**
|
 Interactive matrix grid — click to record full, partial, or pending payments. 
|
|
 ◑ 
**
Partial Payments
**
|
 Enter any amount paid. System auto-sets status: 
`Paid`
 / 
`Partial`
 / 
`Pending`
 and tracks remaining balance. 
|
|
 📒 
**
Ledger
**
|
 Full credit/debit ledger with auto-computed running balance for each group. 
|
|
 📊 
**
Analytics
**
|
 Bar charts, pie charts, monthly trends, and collection rate insights. 
|
|
 🏆 
**
Rankings
**
|
 Member and group leaderboards ranked by payment score and consistency. 
|
|
 🔔 
**
Notifications
**
|
 Real-time alerts for new payments, partial payments, and group creation. 
|
|
 🎯 
**
Smart Targets
**
|
 Auto-calculates total target as 
`members × monthly contribution × duration`
. Supports custom override. 
|
|
 🌗 
**
Dark Mode
**
|
 Premium dark glassmorphism theme with smooth animations and Plus Jakarta Sans + Montserrat fonts. 
|
---
## 🖥️ Tech Stack
|
 Layer 
|
 Technology 
|
|
-------
|
-----------
|
|
**
Frontend
**
|
 React 18, Vite, TailwindCSS 
|
|
**
Backend
**
|
 Node.js, Express.js 
|
|
**
Database
**
|
 MongoDB (Mongoose ODM) 
|
|
**
Auth
**
|
 JWT (Access + Refresh tokens) 
|
|
**
Charts
**
|
 Recharts 
|
|
**
HTTP Client
**
|
 Axios 
|
|
**
Notifications
**
|
 react-hot-toast 
|
|
**
Deployment
**
|
 Render (backend) + Vercel (frontend) 
|
---
## 📁 Project Structure
```
finance management system/
├── package.json              # Root scripts (runs client + server concurrently)
├── render.yaml               # Render deployment config
│
├── server/                   # Node.js + Express Backend (Port 5000)
│   ├── .env                  # Environment variables
│   └── src/
│       ├── index.js          # App entry point, CORS, middleware setup
│       ├── models/
│       │   ├── User.js           # Admin user accounts
│       │   ├── Group.js          # Savings groups with custom target support
│       │   ├── Member.js         # Group members with score & rank
│       │   ├── Contribution.js   # Monthly payments (paid / partial / pending)
│       │   ├── Ledger.js         # Credit/debit ledger entries
│       │   └── Notification.js   # In-app notifications
│       ├── routes/           # Express route definitions
│       ├── controllers/      # Business logic handlers
│       ├── middleware/        # JWT auth & admin-only guards
│       └── utils/
│           ├── ledger.util.js    # Running balance calculator
│           └── ranking.util.js   # Member score recalculator
│
└── client/                   # React + Vite Frontend (Port 5173)
    ├── index.html            # Google Fonts: Plus Jakarta Sans + Montserrat
    └── src/
        ├── App.jsx           # Routes and layout
        ├── pages/
        │   ├── Login.jsx         # Login page
        │   ├── Register.jsx      # Admin-only registration
        │   ├── Dashboard.jsx     # Overview with greeting & stats
        │   ├── Groups.jsx        # Group list + create/edit modal
        │   ├── GroupDetail.jsx   # Group overview, members, ledger
        │   ├── Contributions.jsx # Payment matrix + partial payment modal
        │   ├── Members.jsx       # Member management
        │   ├── Ledger.jsx        # Group ledger view
        │   ├── Analytics.jsx     # Charts and trends
        │   ├── Rankings.jsx      # Leaderboards
        │   └── Notifications.jsx # Notification center
        ├── components/
        │   ├── Sidebar.jsx       # Navigation sidebar (RWDM branding)
        │   ├── Navbar.jsx        # Top bar with user info
        │   └── Modal.jsx         # Reusable modal component
        ├── api/              # Axios API service modules
        └── context/
            └── AuthContext.jsx   # Auth state & token management
```
---
## ⚙️ Local Setup
### Prerequisites
- Node.js v18+
- MongoDB running locally on `mongodb://localhost:27017`
### 1. Start the Backend
### 1. Clone & Install Dependencies
```bash
cd server
npm run dev
# Server starts at http://localhost:5000
git clone <your-repo-url>
cd "finance management system"
npm run install:all
```
### 2. Start the Frontend (new terminal)
### 2. Configure Environment Variables
Create `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/rwdm_db
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```
### 3. Start the Application
```bash
cd client
# Starts both backend (port 5000) and frontend (port 5173) together
npm run dev
# App opens at http://localhost:5173
```
### 3. Register an Admin Account
Go to `http://localhost:5173/register` and choose **Admin** role.
Or start them separately:
```bash
# Terminal 1 — Backend
npm run server
# Terminal 2 — Frontend
npm run client
```
### 4. Create the First Admin Account
Visit `http://localhost:5173/register` — registration creates an **Administrative Account** with full system access.
---
## 📁 Project Structure
## 🔑 API Overview
|
 Method 
|
 Endpoint 
|
 Description 
|
|
--------
|
----------
|
-------------
|
|
 POST 
|
`/api/auth/register`
|
 Register admin account 
|
|
 POST 
|
`/api/auth/login`
|
 Login and get tokens 
|
|
 GET 
|
`/api/groups`
|
 List all groups 
|
|
 POST 
|
`/api/groups`
|
 Create new group 
|
|
 GET 
|
`/api/groups/:id`
|
 Group details with members & ledger 
|
|
 PUT 
|
`/api/groups/:id`
|
 Update group 
|
|
 DELETE 
|
`/api/groups/:id`
|
 Delete group (cascade) 
|
|
 GET 
|
`/api/groups/:id/members`
|
 List group members 
|
|
 POST 
|
`/api/members`
|
 Add member to group 
|
|
 POST 
|
`/api/contributions`
|
 Mark / update payment (supports partial) 
|
|
 GET 
|
`/api/groups/:id/contributions`
|
 Get all contributions 
|
|
 GET 
|
`/api/groups/:id/contributions/summary`
|
 Monthly summary with target vs collected 
|
|
 GET 
|
`/api/groups/:id/ledger`
|
 Get ledger with recalculated running balance 
|
|
 POST 
|
`/api/groups/:id/ledger`
|
 Add manual debit entry 
|
|
 GET 
|
`/api/notifications`
|
 Get user notifications 
|
---
## 💳 Partial Payment Flow
When an admin records a payment for a member:
1. A **Payment Modal** opens with the member's name and required amount
2. Admin enters the actual amount received (e.g. ₹3,000 out of ₹5,000)
3. System auto-determines status:
   - `paidAmount >= required` → ✅ **Paid**
   - `0 < paidAmount < required` → ◑ **Partial** (shows remaining: ₹2,000)
   - `paidAmount = 0` → ○ **Pending**
4. Ledger is credited only by the net new amount received
5. Monthly summary shows `Target`, `Collected`, `Partial count`, and achievement %
---
## 📊 Monthly Target Calculation
```
finance management system/
├── server/                    # Node.js + Express Backend
│   ├── .env                   # Environment variables (MongoDB URI, JWT secrets)
│   └── src/
│       ├── index.js           # App entry point
│       ├── models/            # Mongoose schemas
│       ├── routes/            # Express routes
│       ├── controllers/       # Business logic
│       ├── middleware/        # JWT auth middleware
│       └── utils/             # Ledger & ranking utilities
└── client/                    # React + Vite Frontend
    └── src/
        ├── pages/             # All app pages
        ├── components/        # Reusable components
        ├── api/               # Axios API services
        ├── context/           # AuthContext
        └── styles/            # Global CSS design system
Monthly Target = monthlyContribution × number of active members
```
## 🔑 Environment Variables (`server/.env`)
The **Achievement %** is calculated as:
```
MONGO_URI=mongodb://localhost:27017/financedb
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=5000
(Total Collected for month / Monthly Target) × 100
```
## ✨ Features
- **Auth** — JWT-based login/register with Admin & Member roles
- **Groups** — Create, edit, delete financial groups
- **Members** — Add/edit/remove members with auto contribution generation
- **Contributions** — Interactive matrix grid (click to toggle paid/pending)
- **Ledger** — Credit/debit tracking with running balance
- **Analytics** — Bar, pie, and horizontal bar charts (Recharts)
- **Predictions** — Estimates if a group will hit its target
- **Rankings** — Member and group leaderboards by payment consistency
- **Notifications** — Due payment alerts + bulk reminder sending
- **Smart Insights** — Automatic warnings for slow collections
A month is marked ✅ **Achieved** only when `collected >= target` (i.e., all members have paid in full).
## 🎨 Tech Stack
|
 Layer 
|
 Technology 
|
|
-------
|
-----------
|
|
 Backend 
|
 Node.js, Express 
|
|
 Database 
|
 MongoDB (Mongoose) 
|
|
 Frontend 
|
 React 18, Vite 
|
|
 Charts 
|
 Recharts 
|
|
 Styling 
|
 Vanilla CSS — Dark glassmorphism 
|
|
 Auth 
|
 JWT (access + refresh tokens) 
|
---
## 🚀 Deployment
|
 Service 
|
 Platform 
|
 Notes 
|
|
---------
|
----------
|
-------
|
|
**
Backend
**
|
 Render (Web Service) 
|
`npm start`
 in 
`/server`
|
|
**
Frontend
**
|
 Vercel 
|
`npm run build`
 in 
`/client`
|
|
**
Database
**
|
 MongoDB Atlas 
|
 Free M0 cluster 
|
Set these environment variables in your deployment platforms:
**Backend (Render):**
```
MONGO_URI=<your-atlas-connection-string>
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<another-strong-secret>
FRONTEND_URL=https://your-vercel-app.vercel.app
```
**Frontend (Vercel):**
```
VITE_API_URL=https://your-render-backend.onrender.com
```
---
## 👨‍💻 Author
**T.G.S. Sasi Kumar**  
Built for RWDM — Rural Woman Development Mission  
---
## 📄 License
This project is private and built for internal use by the RWDM organization.
