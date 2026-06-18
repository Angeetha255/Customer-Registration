# Customer Registration and Management System

A full-stack customer registration system built with React, Node.js, Express, and MongoDB.

## Features

- Customer registration with automatic `INT#####` Customer ID generation
- Login, logout, JWT authentication, and protected dashboard routes
- Optional Introducer ID referral tracking
- Customer profile update and password reset flow
- Admin panel with customer search, sorting, pagination, edit/delete, and export
- MongoDB database integration with secure password hashing
- Responsive dashboard UI with sidebar navigation

## Project structure

- `server.js` — backend entry point
- `models/User.js` — user/customer schema and role support
- `routes/auth.js` — authentication and password reset APIs
- `routes/customers.js` — customer management and admin APIs
- `src/` — React frontend pages, routes, and UI components
- `.env.example` — example environment settings

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Edit `.env` with your MongoDB connection and JWT secret.

3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend API runs on `http://localhost:5000`.

## Admin access

A default admin account is created automatically on startup if none exists.

- Email: `admin@example.com`
- Password: `Admin123!`

Update these values in `.env` for production.

## Available scripts

- `npm run dev` — start both frontend and backend in development
- `npm run client` — start Vite frontend only
- `npm run server` — start backend server only
- `npm run build` — build the React app
- `npm run start` — start the backend server

## Notes

- The backend uses JWT tokens stored in local storage for authentication.
- Introducer IDs must refer to an existing customer's `Customer ID`.
- Export supports CSV and PDF from the admin customer list.
