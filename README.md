# SmartSched - React Frontend

Short description: React single-page app for admins and schedulers to manage teachers, classrooms, sections, and trigger/monitor AI-generated class schedules.

## Main Features ✨

* **AI Schedule Generation Interface**: Allows users to input subject details (code, name, teacher, hours, type) for a section and initiate the AI scheduling process via the backend. 📅
* **Data Management (CRUD)**: Provides pages for viewing, adding, editing (Admin only), and deleting (Admin only) Teachers, Classrooms, and Sections. 📚
* **Schedule Viewing & Export**: Displays generated schedules organized by program/section, and allows exporting section schedules to Excel. 📊➡️📄
* **Role-Based Access & User Management**: Features secure login/registration, restricts access based on Admin/Scheduler roles, and includes an Admin page for user approval/deletion. 🔒👥

## Technologies Used 🛠️

* **React**: JavaScript library for UIs.
* **React Router**: For client-side routing.
* **Axios**: For API requests.
* **React Context API**: For global authentication state (`AuthContext`).
* **CSS**: For styling (`index.css`).

## Project Structure 📁

* `src/`: Main application code.
    * `components/`: React components for pages and UI elements.
    * `context/`: `AuthContext.js` for authentication state.
    * `services/`: `api.js` for Axios configuration.
    * `App.js`: Main layout and routing setup.
    * `index.js`: Application entry point.
    * `index.css`: Global styles.
* `public/`: Static assets.

## Setup & Running ▶️

1.  **Prerequisites**: Node.js, npm/yarn, running SmartSched Backend API (default `http://localhost:8080`).
2.  **Installation**: `npm install` (or `yarn install`) in the frontend project directory.
3.  **Configuration**: Verify the API base URL in `src/services/api.js`.
4.  **Run**: `npm start` (or `yarn start`) - usually opens at `http://localhost:3000`.

## Key Components 🧩

* **`App.js`**: Defines layout and routes, using `ProtectedRoute`.
* **`AuthContext.js`**: Manages global auth state and functions (`login`, `logout`, `register`).
* **`api.js`**: Configured Axios instance with JWT interceptors.
* **`ProtectedRoute.js`**: Guards routes based on authentication and roles.
* **Page Components**: Handle UI and logic for specific views (e.g., `GenerateSchedulePage`, `HomePage`, `AdminUsersPage`).

## Authentication Flow 🔑

1.  `AuthContext` checks `localStorage` on load.
2.  Unauthenticated users are redirected to `/login`.
3.  Login via `AuthContext` calls `/api/auth/login`, stores JWT/role on success.
4.  Axios interceptor adds JWT to requests.
5.  `ProtectedRoute` checks token/role for access.
6.  API 401/403 errors trigger logout via interceptor.
7.  Registration requires admin approval.