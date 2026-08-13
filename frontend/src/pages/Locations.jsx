import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import api from "../services/api";

import LocationFormModal from "../components/LocationFormModal";
import LocationDetailsModal from "../components/LocationDetailsModal";

// ===== HELPERS =====
const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const Locations = () => {
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // ===== CURRENT USER =====
  const currentUser = getCurrentUser();

  const role = String(
    currentUser?.role || currentUser?.roleName || currentUser?.role?.name || ""
  ).toUpperCase();

  const canManage = role === "ADMIN" || role === "MANAGER";

  // ===== FETCH LOCATIONS =====
  const fetchLocations = async (showInitialLoading = true) => {
    try {
      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");

      const response = await api.get("/inventory-locations");

      setLocations(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load locations:", err);
      setError(err.response?.data?.message || "Unable to load inventory locations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocations(true);
  }, []);

  // ===== FILTER LOCATIONS =====
  const filteredLocations = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesSearch =
        !searchTerm ||
        location.name?.toLowerCase().includes(searchTerm) ||
        location.description?.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && Boolean(location.is_active)) ||
        (statusFilter === "INACTIVE" && !Boolean(location.is_active));

      return matchesSearch && matchesStatus;
    });
  }, [locations, search, statusFilter]);

  // ===== SUMMARY =====
  const summary = useMemo(() => {
    const active = locations.filter((location) => Boolean(location.is_active)).length;
    const inactive = locations.length - active;

    return { total: locations.length, active, inactive };
  }, [locations]);

  // ===== ACTIONS =====
  const handleCreate = () => {
    setEditingLocation(null);
    setFormOpen(true);
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormOpen(true);
  };

  const handleView = (location) => {
    setSelectedLocation(location);
    setDetailsOpen(true);
  };

  const handleFormSuccess = async () => {
    setFormOpen(false);
    setEditingLocation(null);
    await fetchLocations(false);
  };

  const handleToggleStatus = async (location) => {
    const nextStatus = !Boolean(location.is_active);
    const action = nextStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(`Are you sure you want to ${action} "${location.name}"?`);
    if (!confirmed) return;

    try {
      setError("");

      const response = await api.patch(`/inventory-locations/${location.id}/status`);
      const updated = response.data?.data;

      await fetchLocations(false);

      // Keep the details modal synchronized.
      if (selectedLocation && selectedLocation.id === location.id) {
        setSelectedLocation((current) =>
          current
            ? { ...current, is_active: updated?.isActive ?? updated?.is_active ?? nextStatus }
            : current
        );
      }
    } catch (err) {
      console.error("Failed to update location status:", err);
      setError(err.response?.data?.message || "Unable to update location status.");
    }
  };

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const summaryCards = [
    { key: "total", label: "Total Locations", value: summary.total, caption: "Inventory storage locations", badge: "All", icon: MapPin, color: "violet" },
    { key: "active", label: "Active Locations", value: summary.active, caption: "Available for inventory", badge: "Active", icon: CheckCircle2, color: "emerald" },
    { key: "inactive", label: "Inactive Locations", value: summary.inactive, caption: "Currently unavailable", badge: "Inactive", icon: XCircle, color: "slate" },
  ];

  const colorClasses = {
    violet: { bg: "bg-violet-50", text: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    slate: { bg: "bg-slate-100", text: "text-slate-500" },
  };

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-full bg-white">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <RefreshCw size={20} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">Loading locations</p>
            <p className="mt-1 text-xs text-slate-400">Fetching inventory storage locations...</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="min-h-full bg-white text-slate-900">
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Locations</h1>
            {refreshing && <RefreshCw size={15} className="animate-spin text-violet-500" />}
          </div>
          <p className="mt-1 text-sm text-slate-500">Manage the storage locations where inventory is kept.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLocations(false)}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Plus size={16} />
              Add Location
            </button>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
          <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">Location operation failed</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map(({ key, label, value, caption, badge, icon: Icon, color }) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses[color].bg} ${colorClasses[color].text}`}>
                <Icon size={19} />
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClasses[color].bg} ${colorClasses[color].text}`}>
                {badge}
              </span>
            </div>

            <p className="mt-5 text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1.5 text-xs text-slate-400">{caption}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* FILTER BAR */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search locations..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-xl px-3 text-xs font-semibold text-violet-600 transition hover:bg-violet-50"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* EMPTY */}
        {filteredLocations.length === 0 && (
          <div className="p-14 text-center">
            <MapPin size={28} className="mx-auto text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-700">No locations found</p>
            <p className="mt-1 text-xs text-slate-400">
              {hasActiveFilters ? "Try changing your search or filters." : "Create your first inventory location."}
            </p>

            {!hasActiveFilters && canManage && (
              <button
                type="button"
                onClick={handleCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-100"
              >
                <Plus size={14} />
                Add Location
              </button>
            )}
          </div>
        )}

        {/* TABLE */}
        {filteredLocations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Location</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Created</th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredLocations.map((location) => {
                  const active = Boolean(location.is_active);

                  return (
                    <tr key={location.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <MapPin size={16} />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => handleView(location)}
                              className="truncate text-left text-sm font-semibold text-slate-800 transition hover:text-violet-600"
                            >
                              {location.name}
                            </button>
                            <p className="mt-0.5 text-[11px] text-slate-400">Location #{location.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-md px-6 py-4">
                        <p className="truncate text-sm text-slate-500">{location.description || "No description"}</p>
                      </td>

                      <td className="px-6 py-4">
                        {active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 size={13} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            <XCircle size={13} />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">{formatDate(location.created_at)}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleView(location)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-600 transition hover:bg-violet-50"
                          >
                            View
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleEdit(location)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Edit3 size={13} />
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        {filteredLocations.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-3.5 text-[11px] text-slate-400">
            Showing {filteredLocations.length} of {locations.length} locations
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      <LocationFormModal
        isOpen={formOpen}
        location={editingLocation}
        onClose={() => {
          setFormOpen(false);
          setEditingLocation(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* DETAILS MODAL */}
      <LocationDetailsModal
        location={selectedLocation}
        isOpen={detailsOpen}
        canManage={canManage}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedLocation(null);
        }}
        onEdit={(location) => {
          setDetailsOpen(false);
          setEditingLocation(location);
          setFormOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};

export default Locations;