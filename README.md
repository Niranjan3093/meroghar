# MeroGhar

MeroGhar is a full-stack rental management platform for property owners, tenants, and admins. It covers property listings, visit requests, messaging, lease and payment workflows, maintenance tracking, reviews, and dashboard management.

## Live Deployment

- Frontend: Vercel
- Live site: https://meroghar.vercel.app
- Backend API: Render
- API base URL in production: https://meroghar-u6qk.onrender.com

The frontend is deployed on Vercel and rewrites `/api/*` requests to the Render backend, so production can keep using the same `/api` paths as local development.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Zustand, React Router
- Backend: Node.js, Express, MongoDB, Socket.IO
- Integrations: Passport, JWT, Cloudinary, Nodemailer, Khalti, eSewa, DocuSign

## Project Structure

```text
client/   Frontend application
server/   Backend API and socket server
```

## Local Setup

### Frontend

```bash
cd client
npm install
npm run dev
```

By default, Vite runs at http://localhost:5173.

### Backend

```bash
cd server
npm install
npm run dev
```

The backend listens on the port defined by `PORT` or defaults to `5000`.

## Environment Variables

Set the required environment variables in `server/.env` and, if needed for local frontend development, `client/.env`.

Common backend variables include:

- `PORT`
- `MONGO_URI`
- `CLIENT_URL`
- `SESSION_SECRET`
- `JWT_SECRET`
- `CLOUDINARY_*`
- `KHALTI_*`
- `ESEWA_*`
- `DOCUSIGN_*`

For local frontend API proxying, you can override the Vite proxy target with `VITE_API_PROXY_TARGET` if the backend is not running on `http://127.0.0.1:5000`.

## Available Scripts

### Frontend

From `client/`:

- `npm run dev` - Start the Vite dev server
- `npm run build` - Build the production bundle
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

### Backend

From `server/`:

- `npm start` - Start the production server
- `npm run dev` - Start the server with Nodemon
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:all` - Run the full test suite

## Features

- Role-based authentication for hosts, tenants, and admins
- Property listing management and search
- Visit booking and visit request approval flow
- Real-time messaging and notifications
- Lease and payment handling
- Maintenance request tracking
- Reviews, analytics, and admin oversight

## Production Notes

- The frontend is hosted on Vercel.
- The backend API is hosted on Render.
- Production API requests should continue using `/api/*` paths.
- The backend health endpoint is available at `/api/health`.
