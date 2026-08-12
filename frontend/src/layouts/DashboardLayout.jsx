import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 p-6">

        <Topbar />

        <main className="mt-6">
          {children}
        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;