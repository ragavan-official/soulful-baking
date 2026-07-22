# Soulful Baking Web Application

A premium, highly animated baking-themed React application with a Node/Express backend. Features local and Google OAuth credentials authentication, MongoDB integration, session persistence via JWT, and a protected Admin Console.

## Features

- **Obsidian & Gold Aesthetics**: Premium typography and styles customized for a luxury bakery experience.
- **Micro-Animations**: Uses custom canvas particles background, typing effects (`SplitText`), and interactive shine states (`ShinyText`).
- **Google OAuth Integration**: Connects with Google Sign-in to fetch profile details and save/update accounts in MongoDB.
- **Fixed Admin Account**: Automatically seeds an administrator account with standard credentials:
   - **Email**: `query@soulfulbaking.in`
  - **Password**: `Shaminisha@28`
  - **Role**: `admin`
- **Security**: Password hashing using `bcryptjs` and session authentication utilizing JSON Web Tokens (`jsonwebtoken`).
- **Admin Dashboard**: Visual analytics counts (total users, admin count, standard users) and a registered accounts database table.

---

## Tech Stack

- **Frontend**: React (Vite), Framer Motion, Lucide Icons, Canvas-Confetti, Google Sign-In SDK.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Google Auth Library.

---

## Directory Structure

```
bakery/
├── backend/
│   ├── middleware/
│   │   └── auth.js            # JWT & Admin role verification middleware
│   ├── models/
│   │   └── User.js            # Mongoose schema for user accounts
│   ├── routes/
│   │   └── auth.js            # Authentication endpoints (Register, Login, Google)
│   ├── .env                   # Environment config (Port, DB URI, OAuth Keys)
│   └── index.js               # Express server entry point & Admin seeding
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnimatedBackground.jsx  # Floating golden particle canvas background
│   │   │   ├── Logo.jsx                # Animated golden SVG logo
│   │   │   ├── ShinyText.jsx           # Shiny text effect
│   │   │   └── SplitText.jsx           # Text animation
│   │   ├── views/
│   │   │   ├── Login.jsx               # Sign-in panel with Google OAuth
│   │   │   ├── Signup.jsx              # Register panel
│   │   │   ├── Account.jsx             # User profile details
│   │   │   └── AdminDashboard.jsx      # Admin table & control panel
│   │   ├── App.jsx            # Routing and session hooks
│   │   ├── index.css          # Theme styles, custom inputs, glass cards
│   │   └── main.jsx           # Provider wrappers (Router, Google OAuth)
│   └── vite.config.js
├── package.json               # Root launcher orchestration
└── README.md
```

---

## Configuration & Credentials

### Google Client ID & Secret
- **Client ID**: `<YOUR_GOOGLE_CLIENT_ID>`
- **Client Secret**: `<YOUR_GOOGLE_CLIENT_SECRET>`

Configure these in `backend/.env` and configure the Client ID in `frontend/src/main.jsx`.

---

## Quick Start

### 1. Ensure MongoDB is Running
Make sure MongoDB is running locally on your default port (`mongodb://127.0.0.1:27017`).

### 2. Start the Development Servers
From the root workspace directory, run:
```bash
npm run dev
```

This starts both the frontend server (Vite, listening on port `5174`) and the backend API server (Express, listening on port `3001`) concurrently.

---

## Verification Guide

1. Open your browser and navigate to `http://localhost:5174`.
2. Select **Sign In** using the fixed administrator credentials:
    - **Email**: `query@soulfulbaking.in`
   - **Password**: `Shaminisha@28`
3. Upon success, you will see a confetti explosion and be redirected to the **Admin Dashboard** showing all user tables and metrics.
4. Try logging out and creating a standard user account or signing in using Google OAuth.
# soulful-baking
