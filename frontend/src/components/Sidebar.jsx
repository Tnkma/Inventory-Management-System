import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Tags,
  MapPin,
  ArrowLeftRight,
  Utensils,
  Trash2,
  Users,
  BarChart3,
  Bell,
  ChevronLeft,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    label: "MAIN",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Inventory",
        path: "/inventory",
        icon: Package,
      },
    ],
  },

  {
    label: "INVENTORY",
    items: [
      {
        name: "Ingredients",
        path: "/ingredients",
        icon: Tags,
      },
      {
        name: "Categories",
        path: "/categories",
        icon: Tags,
      },
      {
        name: "Locations",
        path: "/locations",
        icon: MapPin,
      },
    ],
  },

  {
    label: "OPERATIONS",
    items: [
      {
        name: "Purchases",
        path: "/purchases",
        icon: ShoppingCart,
      },
      {
        name: "Transfers",
        path: "/transfers",
        icon: ArrowLeftRight,
      },
      {
        name: "Consumption",
        path: "/consumption",
        icon: Utensils,
      },
      {
        name: "Wastage",
        path: "/wastage",
        icon: Trash2,
      },
    ],
  },

  {
    label: "MANAGEMENT",
    items: [
      {
        name: "Suppliers",
        path: "/suppliers",
        icon: Truck,
      },
      {
        name: "Users",
        path: "/users",
        icon: Users,
      },
    ],
  },

  {
    label: "REPORTING",
    items: [
      {
        name: "Reports",
        path: "/reports",
        icon: BarChart3,
      },
      {
        name: "Notifications",
        path: "/notifications",
        icon: Bell,
      },
    ],
  },
];

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside
      className="
        fixed
        inset-y-0
        left-0
        z-40
        flex
        w-[218px]
        flex-col
        border-r
        border-slate-200
        bg-white
      "
    >

      {/* =====================================================
          BRAND
      ===================================================== */}

      <div
        className="
          flex
          h-[68px]
          items-center
          border-b
          border-slate-100
          px-5
        "
      >

        <div className="flex items-center gap-2.5">

          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-blue-600
              text-sm
              font-bold
              text-white
            "
          >
            R
          </div>

          <div>

            <p className="text-sm font-bold tracking-tight text-slate-900">
              Restaurant
            </p>

            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Inventory
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="flex-1 overflow-y-auto px-3 py-5">

        <div className="space-y-6">

          {navigation.map((section) => (

            <div key={section.label}>

              <p
                className="
                  mb-2
                  px-3
                  text-[10px]
                  font-semibold
                  tracking-[0.12em]
                  text-slate-400
                "
              >
                {section.label}
              </p>


              <div className="space-y-0.5">

                {section.items.map((item) => {

                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `
                          group
                          flex
                          h-9
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          text-[13px]
                          font-medium
                          transition-colors
                          ${
                            isActive
                              ? `
                                bg-blue-50
                                text-blue-700
                              `
                              : `
                                text-slate-600
                                hover:bg-slate-50
                                hover:text-slate-900
                              `
                          }
                        `
                      }
                    >

                      {({ isActive }) => (
                        <>
                          <Icon
                            size={17}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className={
                              isActive
                                ? "text-blue-600"
                                : "text-slate-400 group-hover:text-slate-600"
                            }
                          />

                          <span>
                            {item.name}
                          </span>

                        </>
                      )}

                    </NavLink>
                  );

                })}

              </div>

            </div>

          ))}

        </div>

      </nav>


      {/* =====================================================
          USER
      ===================================================== */}

      <div className="border-t border-slate-100 p-3">

        <div
          className="
            flex
            items-center
            gap-3
            rounded-lg
            px-2
            py-2
          "
        >

          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-slate-900
              text-xs
              font-semibold
              text-white
            "
          >
            {user?.firstName?.charAt(0) || "A"}
          </div>


          <div className="min-w-0">

            <p className="truncate text-xs font-semibold text-slate-800">
              {user?.firstName} {user?.lastName}
            </p>

            <p className="truncate text-[11px] text-slate-400">
              {user?.role || "Administrator"}
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;