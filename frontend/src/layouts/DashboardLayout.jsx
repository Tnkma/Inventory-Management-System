import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar />


      {/* =====================================================
          APPLICATION AREA
      ===================================================== */}

      <div className="min-h-screen lg:pl-[218px]">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <Topbar />


        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <main className="px-4 py-6 sm:px-6 lg:px-8">

          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>

        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;