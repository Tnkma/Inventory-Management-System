# Restaurant Inventory Management System

Full-stack, event-driven Inventory Management System built as an individual project for the SOFTWARE ENGINEERING INDUSTRIAL TRAINING (SE-IT) course.

This repository implements a production-minded inventory application tailored for restaurants (can be adapted to other retail domains). The system provides role-based access, inventory tracking across locations, purchases, transfers, consumptions, wastage handling, notifications and audit logging.

---

## Table of Contents

- Project Overview
- Features
- Tech & Tools
- Architecture & Project Layout
- Quickstart (Run locally)
- Environment configuration
- Database setup
- Running the backend
- Running the frontend
- Creating the initial admin user
- Useful scripts
- Contributing
- License

---

## Project Overview

This application demonstrates a complete full-stack solution:

- Backend: Node.js + Express REST API with JWT authentication, role-based access control, and event handlers for audit and stock updates.
- Database: MySQL (via `mysql2`), with SQL schema and seed data included.
- Frontend: React (Vite) single-page app using Tailwind CSS and Axios for API calls.

It was created to satisfy a course assignment while demonstrating real-world software engineering practices including modular code organization, environment-based configuration, and clear documentation.

## Features

- User authentication (JWT)
- Role-based access control (ADMIN, MANAGER, STORE_KEEPER, KITCHEN_STAFF)
- Users management
- Inventory categories and ingredients (with SKUs and units)
- Inventory locations (multiple storage locations)
- Real-time-ish event-driven audit and stock update handlers
- Purchases and purchase items
- Stock transfers between locations
- Stock movements and wastage tracking
- Consumption recording
- Notifications and audit logs
- Seed data and admin user creation helper

## Tech & Tools

- Backend: Node.js, Express, mysql2, dotenv, bcryptjs, jsonwebtoken, helmet, cors
- Frontend: React, Vite, Tailwind CSS, Axios, lucide-react
- Dev: nodemon, eslint, Vite
- Database: MySQL

## Architecture & Project Layout

High-level layout:

- `src/` - backend source code
	- `src/config/` - configuration files (`env.js`, `database.js`)
	- `src/modules/` - API modules (auth, users, categories, ingredients, purchases, transfers, etc.)
	- `src/events/` - event bus and handlers (audit, stockUpdated)
	- `src/database/` - schema and seed SQL plus helper scripts
	- `src/server.js` - application entrypoint
- `frontend/` - React frontend app (Vite)

Refer to the code for detailed implementations in each module.

## Quickstart (Run locally)

Prerequisites:

- Node.js (v18+ recommended)
- npm (comes with Node.js)
- MySQL or MariaDB server

1. Clone the repository

```bash
git clone <REPO_URL>
cd Inventory-Management-System
```

2. Backend: install dependencies

```bash
npm install
```

3. Frontend: install dependencies

```bash
cd frontend
npm install
cd ..
```

## Environment configuration

Create a `.env` file at the project root (same level as `package.json`) with the following example values:

```
# Server
PORT=5000

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=restaurant_inventory
DB_USER=root
DB_PASSWORD=your_db_password

# Auth
JWT_SECRET=replace_this_with_a_strong_secret
JWT_EXPIRES_IN=1d

# Initial admin account (used by src/database/create-admin.js)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

Important: use strong secrets for `JWT_SECRET` and a secure password for production.

## Database setup

1. Ensure your MySQL server is running.
2. Create the schema and seed data using the provided SQL files (these are located under `src/database`):

```bash
mysql -u <db_user> -p < src/database/schema.sql
mysql -u <db_user> -p < src/database/seed.sql
```

3. (Optional) If you prefer, use a GUI tool (MySQL Workbench, TablePlus, phpMyAdmin) to run the two SQL files.

## Running the backend

From project root:

```bash
# development (auto-reloads)
npm run dev

# or run production server
npm start
```

The API base is served from `http://localhost:5000` by default. The frontend expects the API at `http://localhost:5000/api`.

## Running the frontend

From `frontend/`:

```bash
cd frontend
npm run dev
```

Vite will start the development server (usually at `http://localhost:5173`). The frontend is configured to call the API at `http://localhost:5000/api`. To change that, edit `frontend/src/services/api.js`.

## Creating the initial admin user

After running the SQL seed and configuring `.env`, create the initial admin user with:

```bash
node src/database/create-admin.js
```

This script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables and inserts an admin user if one does not already exist.

## Useful scripts

- `npm run dev` — run backend with `nodemon` for development
- `npm start` — start backend with `node`
- `cd frontend && npm run dev` — start frontend dev server
- `cd frontend && npm run build` — build production frontend bundle

## API Endpoints (high level)

Major REST routes are implemented under `src/modules/*/routes.js` and are namespaced under `/api`. Examples:

- `POST /api/auth/login` — authenticate and obtain JWT
- `GET /api/users` — user listing (role-protected)
- `GET /api/categories` — inventory categories
- `GET /api/ingredients` — ingredients list
- `GET /api/inventory` — inventory per location
- `POST /api/purchases` — create purchase and purchase items
- `POST /api/transfers` — transfer stock between locations

Browse the `src/modules` folder for full list and request shapes.

## Contributing

Contributions are welcome. Suggested process:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Run tests / linting if added
4. Open a pull request with a clear description

Please follow the existing code style and keep changes focused.

## License

This project uses the license defined in `package.json` (ISC).

## Contact

For questions about this project, you can open an issue in the repository.



