import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  X,
  XCircle,
} from "lucide-react";

import api from "../services/api";

const STATUS_CONFIG = {
  HEALTHY: { label: "Healthy", icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-600" },
  LOW: { label: "Low Stock", icon: AlertTriangle, badge: "bg-amber-50 text-amber-600" },
  CRITICAL: { label: "Critical", icon: AlertTriangle, badge: "bg-orange-50 text-orange-600" },
  OUT_OF_STOCK: { label: "Out of Stock", icon: XCircle, badge: "bg-red-50 text-red-600" },
};

const MOVEMENT_LABELS = {
  PURCHASE: "Purchase",
  CONSUMPTION: "Consumption",
  WASTAGE: "Wastage",
  ADJUSTMENT: "Stock Adjustment",
  RETURN: "Return",
  TRANSFER: "Transfer",
};

const InventoryDetailModal = ({ item, onClose }) => {
  const [inventory, setInventory] = useState(item);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===== LOAD INVENTORY DETAILS =====
  useEffect(() => {
    if (!item) return;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const [inventoryResponse, movementsResponse] = await Promise.all([
          api.get(`/inventory/${item.ingredient_id}?locationId=${item.location_id}`),
          api.get(`/inventory/movements?ingredientId=${item.ingredient_id}`),
        ]);

        setInventory(inventoryResponse.data?.data || item);
        setMovements(movementsResponse.data?.data || []);
      } catch (err) {
        console.error("Failed to load inventory details:", err);
        setError(err.response?.data?.message || "Unable to load inventory details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [item]);

  // ===== CLOSE WITH ESCAPE =====
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ===== STOCK STATUS =====
  const getStockStatus = () => {
    const available = Number(inventory?.available_quantity ?? 0);
    const minimum = Number(inventory?.minimum_stock ?? 0);
    const reorder = Number(inventory?.reorder_level ?? 0);

    if (available <= 0) return "OUT_OF_STOCK";
    if (available <= minimum) return "CRITICAL";
    if (available <= reorder) return "LOW";
    return "HEALTHY";
  };

  const status = getStockStatus();
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  // ===== HELPERS =====
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getMovementLabel = (type) => MOVEMENT_LABELS[type] || type || "Stock Movement";

  const isPositiveMovement = (type) => type === "PURCHASE" || type === "RETURN";

  const getMovementIcon = (type) => (isPositiveMovement(type) ? ArrowUpRight : ArrowDownRight);

  const getMovementIconStyle = (type) =>
    isPositiveMovement(type) ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600";

  if (!item) return null;

  const ingredientName = inventory?.ingredient || item.ingredientName || item.name || "Inventory Item";
  const unit = inventory?.unit || item.unit || "";
  const location = inventory?.location || item.locationName || "Unknown location";

  // ===== RENDER =====
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Inventory Details</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{ingredientName}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close inventory details"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* ITEM SUMMARY */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base font-bold text-blue-600">
                  {ingredientName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{ingredientName}</h3>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.badge}`}>
                      <StatusIcon size={13} />
                      {config.label}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>SKU: {inventory?.sku || item.sku || "No SKU"}</span>
                    <span>Unit: {unit || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CURRENT STOCK */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Package size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Current Stock</h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Available quantity</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight text-slate-900">
                        {Number(inventory?.available_quantity ?? 0).toLocaleString()}
                      </span>
                      <span className="text-sm font-medium text-slate-400">{unit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-400">Current</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {Number(inventory?.current_quantity ?? 0).toLocaleString()} {unit}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Reserved</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {Number(inventory?.reserved_quantity ?? 0).toLocaleString()} {unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* INVENTORY INFORMATION */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-violet-600" />
                <h3 className="text-sm font-semibold text-slate-900">Inventory Information</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard label="Current Location" value={location} />
                <InfoCard label="Minimum Stock" value={`${Number(inventory?.minimum_stock ?? 0).toLocaleString()} ${unit}`} />
                <InfoCard label="Reorder Level" value={`${Number(inventory?.reorder_level ?? 0).toLocaleString()} ${unit}`} />
                <InfoCard
                  label="Maximum Stock"
                  value={
                    inventory?.maximum_stock
                      ? `${Number(inventory.maximum_stock).toLocaleString()} ${unit}`
                      : "Not specified"
                  }
                />
              </div>
            </section>

            {/* MOVEMENT HISTORY */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes size={16} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Stock History</h3>
                </div>

                {movements.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    {movements.length} {movements.length === 1 ? "movement" : "movements"}
                  </span>
                )}
              </div>

              {loading && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                  <p className="mt-3 text-sm text-slate-500">Loading stock history...</p>
                </div>
              )}

              {!loading && error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                  <div className="flex items-center gap-3">
                    <XCircle size={20} className="text-red-500" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {!loading && !error && movements.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <Clock3 size={26} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">No stock movements yet</p>
                  <p className="mt-1 text-xs text-slate-400">Stock activity will appear here when inventory changes.</p>
                </div>
              )}

              {!loading && !error && movements.length > 0 && (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {movements.map((movement) => {
                    const MovementIcon = getMovementIcon(movement.movement_type);
                    const positive = isPositiveMovement(movement.movement_type);

                    return (
                      <div key={movement.id} className="flex items-start gap-3 p-4 transition hover:bg-slate-50">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getMovementIconStyle(movement.movement_type)}`}>
                          <MovementIcon size={17} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">{getMovementLabel(movement.movement_type)}</p>
                            <p className={`text-sm font-bold ${positive ? "text-emerald-600" : "text-slate-700"}`}>
                              {positive ? "+" : "-"}
                              {Number(movement.quantity ?? 0).toLocaleString()} {unit}
                            </p>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                            <span>{movement.created_by_name || "System"}</span>
                            <span>{formatDate(movement.created_at)}</span>
                          </div>

                          {movement.reason && <p className="mt-2 text-xs leading-5 text-slate-500">{movement.reason}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* LAST UPDATED */}
            {inventory?.last_stock_update && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <Clock3 size={14} />
                Last stock update:
                <span className="font-semibold text-slate-700">{formatDate(inventory.last_stock_update)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== SMALL INFO CARD =====
const InfoCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
  </div>
);

export default InventoryDetailModal;