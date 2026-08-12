import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  FileText,
  Bell
} from "lucide-react";

import { NavLink } from "react-router-dom";

const Sidebar = () => {

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard"
    },
    {
      name: "Inventory",
      icon: Package,
      path: "/inventory"
    },
    {
      name: "Purchases",
      icon: ShoppingCart,
      path: "/purchases"
    },
    {
      name: "Suppliers",
      icon: Truck,
      path: "/suppliers"
    },
    {
      name: "Users",
      icon: Users,
      path: "/users"
    },
    {
      name: "Reports",
      icon: FileText,
      path: "/reports"
    },
    {
      name: "Notifications",
      icon: Bell,
      path: "/notifications"
    }
  ];

  return (
    <div className="w-72 bg-slate-900 text-white p-6 flex flex-col">

      <div className="mb-10">

        <h1 className="text-2xl font-bold">
          Restaurant IMS
        </h1>

      </div>

      <nav className="space-y-2">

        {menu.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                transition-all
                ${
                  isActive
                    ? "bg-indigo-600"
                    : "hover:bg-slate-800"
                }
                `
              }
            >

              <Icon size={20} />

              {item.name}

            </NavLink>
          );
        })}

      </nav>

    </div>
  );
};

export default Sidebar;