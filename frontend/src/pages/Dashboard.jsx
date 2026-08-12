import { useEffect, useMemo, useState } from "react";

import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Boxes,
  Plus,
  ChevronRight,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";


const Dashboard = () => {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        api.get("/inventory"),
        api.get("/inventory/movements"),
        api.get("/purchases"),
        api.get("/notifications"),
      ]);


      // -------------------------------------------------
      // INVENTORY
      // -------------------------------------------------

      if (results[0].status === "fulfilled") {
        setInventory(
          results[0].value.data?.data || []
        );
      } else {
        console.error(
          "Failed to load inventory:",
          results[0].reason
        );
      }


      // -------------------------------------------------
      // STOCK MOVEMENTS
      // -------------------------------------------------

      if (results[1].status === "fulfilled") {
        setMovements(
          results[1].value.data?.data || []
        );
      } else {
        console.error(
          "Failed to load stock movements:",
          results[1].reason
        );
      }


      // -------------------------------------------------
      // PURCHASES
      // -------------------------------------------------

      if (results[2].status === "fulfilled") {
        setPurchases(
          results[2].value.data?.data || []
        );
      } else {
        console.error(
          "Failed to load purchases:",
          results[2].reason
        );
      }


      // -------------------------------------------------
      // NOTIFICATIONS
      // -------------------------------------------------

      if (results[3].status === "fulfilled") {
        setNotifications(
          results[3].value.data?.data || []
        );
      } else {
        console.error(
          "Failed to load notifications:",
          results[3].reason
        );
      }


      // -------------------------------------------------
      // ONLY SHOW ERROR IF INVENTORY FAILED
      // -------------------------------------------------

      if (results[0].status === "rejected") {
        setError(
          results[0].reason?.response?.data?.message ||
            "Unable to load dashboard data."
        );
      }

    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDashboard();
  }, []);


  // =====================================================
  // UNIQUE INGREDIENTS
  // =====================================================

  const uniqueIngredients = useMemo(() => {
    const ids = new Set();

    inventory.forEach((item) => {
      if (item.ingredient_id !== undefined) {
        ids.add(item.ingredient_id);
      }
    });

    return ids;
  }, [inventory]);


  // =====================================================
  // STOCK STATUS
  // =====================================================

  const getStockStatus = (item) => {
    const available = Number(
      item.available_quantity ?? 0
    );

    const minimum = Number(
      item.minimum_stock ?? 0
    );

    const reorder = Number(
      item.reorder_level ?? 0
    );

    if (available <= 0) {
      return "OUT_OF_STOCK";
    }

    if (available <= minimum) {
      return "CRITICAL";
    }

    if (available <= reorder) {
      return "LOW";
    }

    return "HEALTHY";
  };


  // =====================================================
  // LOW STOCK
  // =====================================================

  const lowStockItems = useMemo(() => {
    return inventory
      .filter((item) => {
        const status =
          getStockStatus(item);

        return (
          status === "LOW" ||
          status === "CRITICAL" ||
          status === "OUT_OF_STOCK"
        );
      })
      .sort(
        (a, b) =>
          Number(a.available_quantity ?? 0) -
          Number(b.available_quantity ?? 0)
      )
      .slice(0, 5);
  }, [inventory]);


  // =====================================================
  // STOCK SUMMARY
  // =====================================================

  const stockSummary = useMemo(() => {
    let available = 0;
    let reserved = 0;
    let healthy = 0;
    let low = 0;
    let critical = 0;
    let outOfStock = 0;

    inventory.forEach((item) => {
      available += Number(
        item.available_quantity ?? 0
      );

      reserved += Number(
        item.reserved_quantity ?? 0
      );

      const status =
        getStockStatus(item);

      if (status === "HEALTHY") {
        healthy++;
      }

      if (status === "LOW") {
        low++;
      }

      if (status === "CRITICAL") {
        critical++;
      }

      if (status === "OUT_OF_STOCK") {
        outOfStock++;
      }
    });

    return {
      available,
      reserved,
      healthy,
      low,
      critical,
      outOfStock,
    };
  }, [inventory]);


  // =====================================================
  // PENDING PURCHASES
  // =====================================================

  const pendingPurchases = useMemo(() => {
    return purchases.filter(
      (purchase) =>
        String(
          purchase.status || ""
        ).toUpperCase() === "PENDING"
    ).length;
  }, [purchases]);


  // =====================================================
  // UNREAD NOTIFICATIONS
  // =====================================================

  const unreadNotifications = useMemo(() => {
    return notifications.filter(
      (notification) =>
        notification.is_read === false ||
        Number(notification.is_read) === 0
    ).length;
  }, [notifications]);


  // =====================================================
  // RECENT ACTIVITY
  // =====================================================

  const recentActivity = useMemo(() => {
    return movements
      .slice()
      .sort((a, b) => {
        return (
          new Date(b.created_at) -
          new Date(a.created_at)
        );
      })
      .slice(0, 6);
  }, [movements]);


  // =====================================================
  // ACTIVITY LABEL
  // =====================================================

  const getMovementLabel = (type) => {
    switch (String(type || "").toUpperCase()) {
      case "PURCHASE":
        return "Purchase";

      case "CONSUMPTION":
        return "Consumption";

      case "TRANSFER":
        return "Transfer";

      case "WASTAGE":
        return "Wastage";

      case "ADJUSTMENT":
        return "Adjustment";

      case "RETURN":
        return "Return";

      default:
        return type || "Movement";
    }
  };


  // =====================================================
  // ACTIVITY POSITIVE / NEGATIVE
  // =====================================================

  const isPositiveMovement = (type) => {
    const positiveTypes = [
      "PURCHASE",
      "RETURN",
    ];

    return positiveTypes.includes(
      String(type || "").toUpperCase()
    );
  };


  // =====================================================
  // TIME AGO
  // =====================================================

  const timeAgo = (date) => {
    if (!date) {
      return "";
    }

    const timestamp =
      new Date(date).getTime();

    if (Number.isNaN(timestamp)) {
      return "";
    }

    const seconds = Math.floor(
      (Date.now() - timestamp) / 1000
    );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(
      seconds / 60
    );

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return new Date(date).toLocaleDateString();
  };


  // =====================================================
  // STOCK CHART
  // =====================================================

  const chartData = useMemo(() => {
    return inventory
      .slice(0, 12)
      .map((item) => {
        const current =
          Number(item.available_quantity ?? 0);

        const reorder =
          Number(item.reorder_level ?? 0);

        if (reorder <= 0) {
          return 50;
        }

        const percentage =
          (current / reorder) * 50;

        return Math.min(
          100,
          Math.max(12, percentage)
        );
      });
  }, [inventory]);


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-full bg-white text-slate-900">


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-7 flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor your restaurant inventory and stock activity.
          </p>

        </div>


        <div className="hidden items-center gap-3 sm:flex">

          <button
            type="button"
            onClick={() =>
              navigate("/inventory")
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <Activity size={17} />

            Activity
          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/inventory")
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md"
          >
            <Plus size={17} />

            Add Stock
          </button>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">

          <div className="flex items-center gap-3">

            <XCircle
              size={19}
              className="text-red-600"
            />

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>


          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>

        </div>

      )}


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL INGREDIENTS */}

        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Package size={21} />
            </div>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
              Inventory
            </span>

          </div>


          <div className="mt-5">

            <p className="text-sm font-medium text-slate-500">
              Total Ingredients
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {loading
                ? "—"
                : uniqueIngredients.size}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Active ingredients
            </p>

          </div>

        </div>


        {/* LOW STOCK */}

        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle size={21} />
            </div>

            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
              Attention
            </span>

          </div>


          <div className="mt-5">

            <p className="text-sm font-medium text-slate-500">
              Low Stock
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {loading
                ? "—"
                : stockSummary.low +
                  stockSummary.critical +
                  stockSummary.outOfStock}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Items need attention
            </p>

          </div>

        </div>


        {/* PENDING PURCHASES */}

        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <ShoppingCart size={21} />
            </div>

            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">
              Purchases
            </span>

          </div>


          <div className="mt-5">

            <p className="text-sm font-medium text-slate-500">
              Pending Purchases
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {loading
                ? "—"
                : pendingPurchases}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Awaiting confirmation
            </p>

          </div>

        </div>


        {/* NOTIFICATIONS */}

        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Bell size={21} />
            </div>

            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
              Alerts
            </span>

          </div>


          <div className="mt-5">

            <p className="text-sm font-medium text-slate-500">
              Notifications
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {loading
                ? "—"
                : unreadNotifications}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Unread notifications
            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">


        {/* =================================================
            STOCK OVERVIEW
        ================================================= */}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-semibold text-slate-900">
                Stock Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current inventory health
              </p>

            </div>


            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity size={19} />
            </div>

          </div>


          {/* STOCK SUMMARY */}

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">

              <p className="text-xs font-medium text-slate-500">
                Available
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : stockSummary.available.toLocaleString()}
              </p>

              <p className="mt-1 text-xs font-medium text-emerald-600">
                Available stock
              </p>

            </div>


            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

              <p className="text-xs font-medium text-slate-500">
                Reserved
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : stockSummary.reserved.toLocaleString()}
              </p>

              <p className="mt-1 text-xs font-medium text-blue-600">
                Currently reserved
              </p>

            </div>


            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">

              <p className="text-xs font-medium text-slate-500">
                Low Stock
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : stockSummary.low +
                    stockSummary.critical +
                    stockSummary.outOfStock}
              </p>

              <p className="mt-1 text-xs font-medium text-amber-600">
                Requires attention
              </p>

            </div>

          </div>


          {/* STOCK VISUAL */}

          <div className="mt-6 flex h-40 items-end gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">

            {chartData.length > 0 ? (

              chartData.map((height, index) => (

                <div
                  key={index}
                  className="flex-1 rounded-t-xl bg-gradient-to-t from-blue-200 to-blue-600 opacity-90 transition-all duration-300 hover:opacity-100"
                  style={{
                    height: `${height}%`,
                  }}
                />

              ))

            ) : (

              <div className="flex w-full items-center justify-center text-sm text-slate-400">
                No stock data available
              </div>

            )}

          </div>

        </div>


        {/* =================================================
            LOW STOCK
        ================================================= */}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-semibold text-slate-900">
                Low Stock
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Items requiring attention
              </p>

            </div>


            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle size={19} />
            </div>

          </div>


          <div className="mt-6 space-y-5">

            {lowStockItems.length === 0 ? (

              <div className="rounded-2xl bg-emerald-50 p-4">

                <p className="text-sm font-semibold text-emerald-700">
                  Stock looks good
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  No ingredients currently require attention.
                </p>

              </div>

            ) : (

              lowStockItems.map((item) => {

                const current =
                  Number(
                    item.available_quantity ?? 0
                  );

                const reorder =
                  Number(
                    item.reorder_level ?? 0
                  );

                const percentage =
                  reorder > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (current / reorder) *
                            100
                        )
                      )
                    : 0;

                return (

                  <div key={item.id}>

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-sm font-semibold text-slate-800">
                          {item.ingredient}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {current.toLocaleString()}{" "}
                          {item.unit} /{" "}
                          {reorder.toLocaleString()}{" "}
                          {item.unit}
                        </p>

                      </div>


                      <span className="text-xs font-semibold text-amber-600">
                        {percentage}%
                      </span>

                    </div>


                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>

                );
              })

            )}

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/inventory")
            }
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-blue-600"
          >
            View inventory

            <ChevronRight size={16} />

          </button>

        </div>

      </div>


      {/* =================================================
          RECENT ACTIVITY
      ================================================= */}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="font-semibold text-slate-900">
              Recent Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest inventory movements
            </p>

          </div>


          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Boxes size={19} />
          </div>

        </div>


        <div className="mt-5 divide-y divide-slate-100">

          {recentActivity.length === 0 ? (

            <div className="py-10 text-center">

              <Boxes
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-medium text-slate-600">
                No recent activity
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Stock movements will appear here.
              </p>

            </div>

          ) : (

            recentActivity.map((activity) => {

              const positive =
                isPositiveMovement(
                  activity.movement_type
                );

              const quantity =
                Number(
                  activity.quantity ?? 0
                );

              return (

                <div
                  key={activity.id}
                  className="flex items-center justify-between gap-4 py-4"
                >

                  <div className="flex min-w-0 items-center gap-4">

                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${
                          positive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }
                      `}
                    >

                      {positive ? (
                        <ArrowUpRight size={18} />
                      ) : (
                        <ArrowDownRight size={18} />
                      )}

                    </div>


                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-800">
                        {activity.ingredient ||
                          "Unknown ingredient"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {getMovementLabel(
                          activity.movement_type
                        )}

                        {activity.location
                          ? ` · ${activity.location}`
                          : ""}

                        {activity.created_by_name
                          ? ` · ${activity.created_by_name}`
                          : ""}
                      </p>

                    </div>

                  </div>


                  <div className="shrink-0 text-right">

                    <p
                      className={
                        positive
                          ? "text-sm font-semibold text-emerald-600"
                          : "text-sm font-semibold text-slate-700"
                      }
                    >
                      {positive ? "+" : "-"}
                      {quantity.toLocaleString()}{" "}
                      {activity.unit || ""}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {timeAgo(
                        activity.created_at
                      )}
                    </p>

                  </div>

                </div>

              );
            })

          )}

        </div>

      </div>


      {/* =================================================
          REFRESH
      ================================================= */}

      <div className="flex justify-end">

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >

          <RefreshCw
            size={14}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh dashboard

        </button>

      </div>

    </div>
  );
};


export default Dashboard;