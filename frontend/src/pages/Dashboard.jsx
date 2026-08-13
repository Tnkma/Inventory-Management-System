import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Plus,
  ChevronRight,
  RefreshCw,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import api from "../services/api";
import AddStockModal from "../components/AddStockModal";

const Dashboard = () => {
  const navigate = useNavigate();

  // ===== STATE =====
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);

  // ===== FETCH DASHBOARD DATA =====
  const fetchDashboardData = async (showInitialLoading = true) => {
    try {
      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");

      const results = await Promise.allSettled([
        api.get("/inventory"),
        api.get("/inventory/movements"),
        api.get("/purchases"),
        api.get("/notifications"),
      ]);

      const [inventoryResult, movementsResult, purchasesResult, notificationsResult] = results;

      if (inventoryResult.status === "fulfilled") {
        setInventory(inventoryResult.value.data?.data || []);
      } else {
        console.error("Failed to load inventory:", inventoryResult.reason);
      }

      if (movementsResult.status === "fulfilled") {
        setMovements(movementsResult.value.data?.data || []);
      } else {
        console.error("Failed to load stock movements:", movementsResult.reason);
      }

      if (purchasesResult.status === "fulfilled") {
        setPurchases(purchasesResult.value.data?.data || []);
      } else {
        console.error("Failed to load purchases:", purchasesResult.reason);
      }

      if (notificationsResult.status === "fulfilled") {
        setNotifications(notificationsResult.value.data?.data || []);
      } else {
        console.error("Failed to load notifications:", notificationsResult.reason);
      }

      if (inventoryResult.status === "rejected") {
        setError(
          inventoryResult.reason?.response?.data?.message ||
            "Unable to load dashboard inventory data."
        );
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(err.response?.data?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  // ===== STOCK STATUS =====
  const getStockStatus = (item) => {
    const available = Number(item.available_quantity ?? 0);
    const minimum = Number(item.minimum_stock ?? 0);
    const reorder = Number(item.reorder_level ?? 0);

    if (available <= 0) return "OUT_OF_STOCK";
    if (available <= minimum) return "CRITICAL";
    if (available <= reorder) return "LOW";
    return "HEALTHY";
  };

  // ===== INVENTORY SUMMARY =====
  const inventorySummary = useMemo(() => {
    let healthy = 0;
    let low = 0;
    let critical = 0;
    let outOfStock = 0;
    let availableQuantity = 0;
    let reservedQuantity = 0;

    inventory.forEach((item) => {
      const status = getStockStatus(item);

      if (status === "HEALTHY") healthy += 1;
      if (status === "LOW") low += 1;
      if (status === "CRITICAL") critical += 1;
      if (status === "OUT_OF_STOCK") outOfStock += 1;

      availableQuantity += Number(item.available_quantity ?? 0);
      reservedQuantity += Number(item.reserved_quantity ?? 0);
    });

    return {
      total: inventory.length,
      healthy,
      low,
      critical,
      outOfStock,
      attention: low + critical,
      availableQuantity,
      reservedQuantity,
    };
  }, [inventory]);

  // ===== LOW STOCK ITEMS =====
  const lowStockItems = useMemo(() => {
    return inventory
      .filter((item) => {
        const status = getStockStatus(item);
        return status === "LOW" || status === "CRITICAL" || status === "OUT_OF_STOCK";
      })
      .sort((a, b) => Number(a.available_quantity ?? 0) - Number(b.available_quantity ?? 0))
      .slice(0, 5);
  }, [inventory]);

  // ===== PENDING PURCHASES =====
  const pendingPurchases = useMemo(() => {
    return purchases.filter((p) => String(p.status || "").toUpperCase() === "PENDING").length;
  }, [purchases]);

  // ===== UNREAD NOTIFICATIONS =====
  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // ===== RECENT ACTIVITY =====
  const recentActivity = useMemo(() => {
    return [...movements]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6);
  }, [movements]);

  // ===== TIME FORMATTER =====
  const formatRelativeTime = (dateValue) => {
    if (!dateValue) return "Recently";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const difference = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (difference < 60) return "Just now";

    const minutes = Math.floor(difference / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  // ===== MOVEMENT HELPERS =====
  const isPositiveMovement = (movementType) => {
    const type = String(movementType || "").toUpperCase();
    return type === "PURCHASE" || type === "RETURN";
  };

  const getMovementIcon = (movementType) => (isPositiveMovement(movementType) ? ArrowUpRight : ArrowDownRight);

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-full bg-white">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <RefreshCw size={20} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">Loading dashboard</p>
            <p className="mt-1 text-xs text-slate-400">Fetching your latest inventory data...</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== STAT CARD CONFIG =====
  const statCards = [
    {
      key: "total",
      label: "Total Ingredients",
      value: inventorySummary.total,
      caption: "Currently tracked in inventory",
      badge: "Active",
      icon: Package,
      color: "blue",
    },
    {
      key: "attention",
      label: "Low Stock",
      value: inventorySummary.attention,
      caption: `${inventorySummary.outOfStock} out of stock`,
      badge: "Attention",
      icon: AlertTriangle,
      color: "amber",
    },
    {
      key: "purchases",
      label: "Pending Purchases",
      value: pendingPurchases,
      caption: "Awaiting confirmation",
      badge: "Pending",
      icon: ShoppingCart,
      color: "violet",
    },
    {
      key: "notifications",
      label: "Notifications",
      value: unreadNotifications,
      caption: "Requiring your attention",
      badge: "Unread",
      icon: Bell,
      color: "rose",
    },
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    violet: { bg: "bg-violet-50", text: "text-violet-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
  };

  const healthPct = inventorySummary.total > 0 ? (inventorySummary.healthy / inventorySummary.total) * 100 : 0;
  const lowPct = inventorySummary.total > 0 ? (inventorySummary.low / inventorySummary.total) * 100 : 0;
  const criticalPct = inventorySummary.total > 0 ? (inventorySummary.critical / inventorySummary.total) * 100 : 0;
  const outOfStockPct = inventorySummary.total > 0 ? (inventorySummary.outOfStock / inventorySummary.total) * 100 : 0;

  // ===== MAIN RENDER =====
  return (
    <div className="min-h-full bg-white text-slate-900">
      {/* PAGE HEADER */}
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
            {refreshing && <RefreshCw size={15} className="animate-spin text-blue-500" />}
          </div>
          <p className="mt-1 text-sm text-slate-500">Monitor your restaurant inventory and stock activity.</p>
          <p className="mt-1.5 text-xs font-medium text-slate-400">{currentDate}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowAddStock(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md"
          >
            <Plus size={17} />
            Add Stock
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
          <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">Dashboard data could not be fully loaded</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, label, value, caption, badge, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses[color].bg} ${colorClasses[color].text}`}>
                <Icon size={19} />
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClasses[color].bg} ${colorClasses[color].text}`}>
                {badge}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
              <p className="mt-1.5 text-xs text-slate-400">{caption}</p>
            </div>
          </div>
        ))}
      </div>

      {/* STOCK OVERVIEW + LOW STOCK */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* STOCK OVERVIEW */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Stock Overview</h2>
              <p className="mt-1 text-xs text-slate-500">Current inventory health across your locations</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View inventory
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <p className="text-xs font-medium text-slate-500">Healthy</p>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">{inventorySummary.healthy}</p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-medium text-slate-500">Available Qty</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{inventorySummary.availableQuantity.toLocaleString()}</p>
              <p className="mt-0.5 text-[11px] text-blue-600">Across inventory</p>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-xs font-medium text-slate-500">Reserved</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{inventorySummary.reservedQuantity.toLocaleString()}</p>
              <p className="mt-0.5 text-[11px] text-violet-600">Currently reserved</p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
              <p className="text-xs font-medium text-slate-500">Critical</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{inventorySummary.critical}</p>
              <p className="mt-0.5 text-[11px] text-red-600">Immediate attention</p>
            </div>
          </div>

          {/* STOCK HEALTH BAR */}
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">Inventory health</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Based on current available quantities</p>
              </div>
              <span className="text-xs font-semibold text-slate-600">{Math.round(healthPct)}%</span>
            </div>

            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-200">
              {inventorySummary.total > 0 && (
                <>
                  <div className="h-full bg-emerald-500" style={{ width: `${healthPct}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${lowPct}%` }} />
                  <div className="h-full bg-orange-500" style={{ width: `${criticalPct}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${outOfStockPct}%` }} />
                </>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-500">Healthy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-[11px] text-slate-500">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-[11px] text-slate-500">Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-[11px] text-slate-500">Out of stock</span>
              </div>
            </div>
          </div>
        </div>

        {/* LOW STOCK */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Low Stock</h2>
              <p className="mt-1 text-xs text-slate-500">Items requiring attention</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle size={17} />
            </div>
          </div>

          <div className="mt-5">
            {lowStockItems.length === 0 ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-5 text-center">
                <CheckCircle2 size={22} className="mx-auto text-emerald-500" />
                <p className="mt-2 text-xs font-semibold text-emerald-700">Inventory looks healthy</p>
                <p className="mt-1 text-[11px] text-emerald-600">No items currently need attention.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockItems.map((item) => {
                  const available = Number(item.available_quantity ?? 0);
                  const reorder = Number(item.reorder_level ?? 0);
                  const percentage = reorder > 0 ? Math.min(100, Math.round((available / reorder) * 100)) : 0;
                  const status = getStockStatus(item);

                  const statusColor =
                    status === "OUT_OF_STOCK" ? "text-red-600" : status === "CRITICAL" ? "text-orange-600" : "text-amber-600";
                  const barColor =
                    status === "OUT_OF_STOCK" ? "bg-red-500" : status === "CRITICAL" ? "bg-orange-500" : "bg-amber-400";

                  return (
                    <div key={`${item.id}-${item.location_id}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {item.ingredient || item.name || "Unknown item"}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-400">
                            {available.toLocaleString()} {item.unit || ""} · {item.location || "Unknown location"}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[11px] font-semibold ${statusColor}`}>
                          {status === "OUT_OF_STOCK" ? "Out" : `${percentage}%`}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600"
          >
            View inventory
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
            <p className="mt-1 text-xs text-slate-500">Latest inventory movements</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            View all
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {recentActivity.length === 0 ? (
            <div className="py-10 text-center">
              <Boxes size={24} className="mx-auto text-slate-300" />
              <p className="mt-3 text-xs font-semibold text-slate-600">No recent activity</p>
              <p className="mt-1 text-[11px] text-slate-400">Stock movements will appear here.</p>
            </div>
          ) : (
            recentActivity.map((activity) => {
              const positive = isPositiveMovement(activity.movement_type);
              const ActivityIcon = getMovementIcon(activity.movement_type);
              const quantity = Number(activity.quantity ?? 0);

              return (
                <div key={activity.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        positive ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <ActivityIcon size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {activity.ingredient || "Inventory item"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {String(activity.movement_type || "MOVEMENT").replace(/_/g, " ")} ·{" "}
                        {activity.location || "Inventory"}
                        {activity.created_by_name ? ` · ${activity.created_by_name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-xs font-semibold ${positive ? "text-emerald-600" : "text-slate-700"}`}>
                      {positive ? "+" : "-"}
                      {Math.abs(quantity).toLocaleString()} {activity.unit || ""}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{formatRelativeTime(activity.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ADD STOCK MODAL */}
      <AddStockModal isOpen={showAddStock} onClose={() => setShowAddStock(false)} onSuccess={() => fetchDashboardData(false)} />
    </div>
  );
};

export default Dashboard;