

# Plastify Cost Analysis Web App

A full-stack web application for managing and analyzing cost inputs and output expectations in a company setup. Ideal for manufacturing and production environments, this app helps track material costs, generate reports, raise alerts, and visualize profit margins.



## Tech Stack

- **Frontend:** React.js (with TailwindCSS)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas (cloud)
- **APIs & Utilities:** REST API, Mongoose, dotenv, nodemon



## Getting Started

Clone the repository and install the dependencies for both frontend and backend.

### 1. Install Dependencies

```bash
npm install

Installs all required node modules for both frontend and backend.


---

2. Run the App

Frontend (React)

npm start

Runs the frontend in development mode.

Open http://localhost:3000 to view it in your browser.

The page reloads on changes and shows lint errors in the console.


Backend (Express Server)

npm run dev

Starts the backend Express server using nodemon.

Server runs on port 5000 by default.

Ensure .env has your correct MongoDB connection string.



---

Scripts

Command	Description

npm install	Installs node modules
npm start	Starts the React frontend
npm run dev	Starts the Express backend using nodemon
npm run build	Builds the React app for production
npm test	Runs frontend tests
npm run eject	Ejects React config (advanced)



---

Folder Structure

/plastify-costing-app
│
├── backend/              # Express backend
│   ├── routes/           # API routes (e.g., products)
│   ├── models/           # Mongoose schemas
│   └── server.js         # Main backend server
│
├── src/                  # React frontend
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page views (e.g., Dashboard)
│   ├── App.js            # Main component
│   └── index.js          # Entry point
│
├── public/               # Static files
├── .env                  # Environment variables (not committed)
├── README.md             # Project info
└── package.json          # Scripts & metadata


---

Features

Material Cost Entry: Add materials, costs, and quantities.

Dynamic Calculations: Auto-updates margins and totals.

Real-time Alerts: Get notified when costs spike or margins fall.

Report Generator: Export downloadable reports (CSV/PDF).

Download History: Track generated reports.

Modern UI: Built with TailwindCSS for a responsive layout.

Dark/Light Mode: Optional toggle.



Environment Variables

Create a .env file in your backend directory with the following:

MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000



Coming Soon

User authentication (admin/user roles)

Notification system

Advanced analytics dashboard

Mobile-friendly enhancements




License

MIT



Built with passion by [Lemonhead - SacredLemon] and Team Plastify.


Would you like a downloadable version of this README or for me to help auto-generate one inside your project?

