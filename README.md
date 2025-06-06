# Costify Web App
A full-stack web application for managing and analyzing cost inputs and output expectations within a company setup. Ideal for manufacturing and production environments, Costify helps you track material costs, generate reports, raise alerts, and visualize profit margins with ease.

---
## 🧾 Table of Contents
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Installation](#installation)
* [Usage](#usage)
* [Folder Structure](#folder-structure)
* [Environment Variables](#environment-variables)
* [Scripts](#scripts)
* [Coming Soon](#coming-soon)
* [Contributors](#contributors)
* [License](#license)

## 🚀 Features
* **Material Cost Entry**: Add materials, costs, and quantities.
* **Dynamic Calculations**: Automatically updates margins and total costs.
* **Real-time Alerts**: Notifies when costs spike or margins decrease.
* **Report Generator**: Export reports in CSV or PDF formats.
* **Download History**: Keeps track of generated reports.
* **Modern UI**: Built with TailwindCSS for a sleek and responsive layout.
* **Dark/Light Mode**: Toggle between visual themes.

---

## 🛠 Tech Stack

**Frontend**

* React.js
* TailwindCSS

**Backend**

* Node.js
* Express.js

**Database**

* MongoDB Atlas (cloud-hosted)

**APIs & Utilities**

* REST API
* Mongoose
* dotenv
* nodemon

---

## 📦 Installation

Clone the repository and install dependencies for both the frontend and backend.

```bash
git clone https://github.com/lemonhead-ai/costing-analysis.git
cd costing-analysis
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../src
npm install
```

---

## ▶️ Usage

### Start Backend Server (Express)
```bash
cd backend
npm run dev
```

* Runs on `http://localhost:5000` by default.
* Make sure `.env` is configured correctly.

### Start Frontend (React)

```bash
cd src
npm start
```

* Runs the app in development mode.
* Open `http://localhost:3000` in your browser.

---
## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory with the following:

```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000
```

---

## 📜 Scripts

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `npm install`   | Installs all project dependencies      |
| `npm start`     | Starts the React frontend in dev mode  |
| `npm run dev`   | Starts the backend with nodemon        |
| `npm run build` | Builds the React app for production    |
| `npm test`      | Runs frontend tests                    |
| `npm run eject` | Ejects React config (use with caution) |

---

## 📈 Coming Soon
* 🔐 **User Authentication** (Admin/User roles)
* 🔔 **Notification System**
* 📊 **Advanced Analytics Dashboard**
* 📱 **Mobile-Friendly Enhancements**

---
## 👥 Contributors
Built with passion by **Lemonhead** and **Team Costify**.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
