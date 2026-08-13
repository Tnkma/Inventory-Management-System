import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import InventoryDetailModal from "./components/InventoryDetailModal";
import Categories from "./pages/Categories";
import Locations from "./pages/Locations";
import Transfers from "./pages/Transfers";



import Ingredients from "./pages/Ingredients";

import Login from "./pages/auth/Login";

import { useAuth } from "./context/AuthContext";


const ProtectedRoute = ({ children }) => {

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


const App = () => {

  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* INVENTORY */}

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Inventory />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* TRANSFERS */}

        <Route
          path="/transfers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Transfers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />  


        {/* PURCHASES */}

        <Route
          path="/purchases"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Purchases />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* LOCATIONS */}

        <Route
          path="/locations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Locations />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />  


        {/* SUPPLIERS */}

        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suppliers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* USERS */}

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Users />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* REPORTS */}

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* NOTIFICATIONS */}

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

      {/* INVENTORY DETAIL */}
      <Route
        path="/inventory/:ingredientId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <InventoryDetailModal />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />


        {/* DEFAULT */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* UNKNOWN ROUTE */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      {/* INGREDIENTS */}
      <Route
        path="/ingredients"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Ingredients />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />  

      {/* CATEGORIES */}
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Categories />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      </Routes>

    </BrowserRouter>
  );
};


export default App;