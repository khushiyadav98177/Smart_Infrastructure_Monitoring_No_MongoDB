# Smart Infrastructure Monitoring — No MongoDB

This edition stores users and reports in `backend/data/store.json`; it does not use MongoDB or Mongoose.

## Run
1. Install Node.js 18+.
2. In VS Code, open the `Smart_Infrastructure_Monitoring` folder.
3. In a terminal: `cd backend` then `npm install`.
4. Copy `backend/.env.example` to `backend/.env`; set a long random `JWT_SECRET`.
5. Run `npm run dev` in the backend terminal.
6. Open a second terminal: `cd frontend`, `npm install`, `npm run dev`.
7. Open the Vite URL, usually http://localhost:5173.

## Admin
Register an account first, then in a third terminal run from `backend`:
`npm run make-admin -- your-email@example.com`
Sign out and sign back in.

## Data
JSON data is stored in `backend/data/store.json`; uploaded images are in `backend/uploads`. Back up both. This storage approach is for a local college demo or single-instance prototype, not concurrent production use.
