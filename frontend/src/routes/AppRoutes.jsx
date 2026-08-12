import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "../pages/auth/Login";
import ProtectedRoute from "./ProtectedRoute";

import { useAuth } from "../context/AuthContext";


const Dashboard = () => {

  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">

      <header className="bg-slate-800 px-6 py-4 text-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>
            <h1 className="text-xl font-bold">
              Restaurant Inventory
            </h1>

            <p className="text-sm text-slate-300">
              Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="text-right">

              <p className="font-medium">
                {user?.firstName} {user?.lastName}
              </p>

              <p className="text-xs text-slate-300">
                {user?.role}
              </p>

            </div>

            <button
              onClick={logout}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-7xl px-6 py-8">

        <div className="rounded-xl bg-white p-8 shadow">

          <h2 className="text-2xl font-bold text-slate-800">
            Welcome, {user?.firstName}
          </h2>

          <p className="mt-2 text-slate-500">
            You are logged in as {user?.role}.
          </p>

        </div>

      </main>

    </div>
  );
};


const AppRoutes = () => {

  return (
    <BrowserRouter>

      <Routes>

        {/* Public routes */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* Protected routes */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

        </Route>


        {/* Unknown routes */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
};


export default AppRoutes;