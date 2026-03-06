# Relief Ledger

MERN stack application for transparent relief fund management.

## Structure

- `backend/` - Express server with MongoDB via Mongoose
- `frontend/` - React client app

## Getting Started

1. Install MongoDB and set `MONGO_URI` in `backend/.env`.
2. `cd backend && npm install && npm run dev`
3. In another terminal: `cd frontend && npm install && npm start`

Registration and login pages are available at `http://localhost:3000`.

The frontend includes styled forms and a header component; edit `src/App.css` to tweak appearance.
