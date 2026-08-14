import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Edit3,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Store,
  Warehouse,
  XCircle,
} from "lucide-react";

import api from "../services/api";

import LocationFormModal from "../components/LocationFormModal";
import LocationDetailsModal from "../components/LocationDetailsModal";

import PurchaseDetailModal from "../components/PurchaseDetails";
import TransferDetailModal from "../components/TransferDetailsModal";


// =========================================================
// HELPERS
// =========================================================

const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user");

    return user
      ? JSON.parse(user)
      : null;

  } catch {
    return null;
  }
};


const formatNumber = (value) => {

  return Number(value || 0).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 3,
    }
  );
};


// =========================================================
// LOCATION TYPE
// =========================================================

const isMainStore = (location) => {

  return (
    String(
      location?.location_type ||
      location?.locationType ||
      ""
    ).toUpperCase() === "MAIN_STORE"
  );

};


// =========================================================
// COMPONENT
// =========================================================

const Locations = () => {

  // =======================================================
  // LOCATIONS
  // =======================================================

  const [locations, setLocations] =
    useState([]);

  const [locationStock, setLocationStock] =
    useState({});


  // =======================================================
  // PAGE STATE
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  // =======================================================
  // FILTERS
  // =======================================================

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");


  // =======================================================
  // LOCATION DETAILS
  // =======================================================

  const [selectedLocation, setSelectedLocation] =
    useState(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);


  // =======================================================
  // LOCATION FORM
  // =======================================================

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingLocation, setEditingLocation] =
    useState(null);


  // =======================================================
  // PURCHASE DETAIL MODAL
  // =======================================================

  const [selectedPurchaseId, setSelectedPurchaseId] =
    useState(null);

  const [purchaseDetailsOpen, setPurchaseDetailsOpen] =
    useState(false);


  // =======================================================
  // TRANSFER DETAIL MODAL
  // =======================================================

  const [selectedTransferId, setSelectedTransferId] =
    useState(null);

  const [transferDetailsOpen, setTransferDetailsOpen] =
    useState(false);


  // =======================================================
  // CURRENT USER
  // =======================================================

  const currentUser =
    getCurrentUser();


  const role = String(
    currentUser?.role ||
    currentUser?.roleName ||
    currentUser?.role?.name ||
    ""
  ).toUpperCase();


  const canManage =
    role === "ADMIN" ||
    role === "MANAGER";


  // =======================================================
  // LOAD STOCK FOR LOCATIONS
  // =======================================================

  const loadLocationStock =
    async (locationList) => {

      if (
        !Array.isArray(locationList) ||
        locationList.length === 0
      ) {

        setLocationStock({});
        return;
      }


      try {

        const responses =
          await Promise.all(
            locationList.map(
              async (location) => {

                try {

                  const response =
                    await api.get(
                      `/inventory-locations/${location.id}/stock`
                    );


                  return {
                    locationId:
                      location.id,

                    data:
                      response.data?.data ||
                      null,
                  };

                } catch (err) {

                  console.error(
                    `Failed to load stock for location ${location.id}:`,
                    err
                  );


                  return {
                    locationId:
                      location.id,

                    data: null,
                  };
                }
              }
            )
          );


        const stockMap = {};


        responses.forEach(
          ({
            locationId,
            data,
          }) => {

            if (!data) {
              return;
            }


            const location =
              data.location ||
              locationList.find(
                (item) =>
                  Number(item.id) ===
                  Number(locationId)
              );


            const mainStore =
              isMainStore(location);


            const items =
              Array.isArray(data.items)
                ? data.items
                : [];


            let current = 0;
            let reserved = 0;
            let available = 0;


            items.forEach(
              (item) => {

                const itemCurrent =
                  Number(
                    item.current_quantity || 0
                  );


                /*
                 * RESERVED STOCK EXISTS ONLY
                 * FOR THE MAIN STORE.
                 */
                const itemReserved =
                  mainStore
                    ? Number(
                        item.reserved_quantity || 0
                      )
                    : 0;


                /*
                 * MAIN STORE:
                 * available = current - reserved
                 *
                 * KITCHEN:
                 * available = current
                 */
                const itemAvailable =
                  mainStore
                    ? Number(
                        item.available_quantity ??
                        (
                          itemCurrent -
                          itemReserved
                        )
                      )
                    : itemCurrent;


                current +=
                  itemCurrent;


                reserved +=
                  itemReserved;


                available +=
                  itemAvailable;
              }
            );


            stockMap[locationId] = {

              location,

              items,

              ingredientCount:
                items.length,

              current,

              reserved,

              available,

              isMainStore:
                mainStore,
            };
          }
        );


        setLocationStock(
          stockMap
        );

      } catch (err) {

        console.error(
          "Failed to load location stock:",
          err
        );
      }
    };


  // =======================================================
  // FETCH LOCATIONS
  // =======================================================

  const fetchLocations =
    async (showInitialLoading = true) => {

      try {

        if (showInitialLoading) {

          setLoading(true);

        } else {

          setRefreshing(true);
        }


        setError("");


        const response =
          await api.get(
            "/inventory-locations"
          );


        const locationData =
          response.data?.data || [];


        setLocations(
          locationData
        );


        await loadLocationStock(
          locationData
        );


        // ---------------------------------------------------
        // Refresh selected location
        // ---------------------------------------------------

        if (selectedLocation) {

          const refreshedLocation =
            locationData.find(
              (location) =>
                Number(location.id) ===
                Number(selectedLocation.id)
            );


          if (refreshedLocation) {

            setSelectedLocation(
              (current) => ({
                ...current,
                ...refreshedLocation,
              })
            );
          }
        }

      } catch (err) {

        console.error(
          "Failed to load locations:",
          err
        );


        setError(
          err.response?.data?.message ||
          "Unable to load inventory locations."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);
      }
    };


  useEffect(() => {

    fetchLocations(true);

  }, []);


  // =======================================================
  // FILTER LOCATIONS
  // =======================================================

  const filteredLocations =
    useMemo(() => {

      const searchTerm =
        search
          .trim()
          .toLowerCase();


      return locations.filter(
        (location) => {

          const matchesSearch =
            !searchTerm ||
            location.name
              ?.toLowerCase()
              .includes(searchTerm) ||
            location.description
              ?.toLowerCase()
              .includes(searchTerm);


          const matchesStatus =
            statusFilter === "ALL" ||
            (
              statusFilter === "ACTIVE" &&
              Boolean(location.is_active)
            ) ||
            (
              statusFilter === "INACTIVE" &&
              !Boolean(location.is_active)
            );


          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      locations,
      search,
      statusFilter,
    ]);


  // =======================================================
  // LOCATION GROUPS
  // =======================================================

  const mainStore =
    useMemo(
      () => {

        return (
          filteredLocations.find(
            (location) =>
              isMainStore(location)
          ) || null
        );

      },
      [
        filteredLocations,
      ]
    );


  const kitchenLocations =
    useMemo(
      () => {

        return filteredLocations.filter(
          (location) =>
            !isMainStore(location)
        );

      },
      [
        filteredLocations,
      ]
    );


  // =======================================================
  // SUMMARY
  // =======================================================

  const summary =
    useMemo(() => {

      const active =
        locations.filter(
          (location) =>
            Boolean(location.is_active)
        ).length;


      const inactive =
        locations.length -
        active;


      const mainStoreLocation =
        locations.find(
          (location) =>
            isMainStore(location)
        );


      const mainStoreStock =
        mainStoreLocation
          ? locationStock[
              mainStoreLocation.id
            ] || {}
          : {};


      let ingredientCount = 0;
      let current = 0;
      let reserved = 0;
      let available = 0;


      /*
       * Track ALL STOCK records.
       *
       * Reserved stock is deliberately
       * counted only from Main Store.
       */
      Object.entries(
        locationStock
      ).forEach(
        ([
          locationId,
          stock,
        ]) => {

          ingredientCount +=
            Number(
              stock.ingredientCount || 0
            );


          current +=
            Number(
              stock.current || 0
            );


          if (
            stock.isMainStore
          ) {

            reserved +=
              Number(
                stock.reserved || 0
              );

            available +=
              Number(
                stock.available || 0
              );

          } else {

            /*
             * Kitchen stock has no
             * reservation bucket.
             */
            available +=
              Number(
                stock.current || 0
              );
          }
        }
      );


      return {

        total:
          locations.length,

        active,

        inactive,

        ingredientCount,

        current,

        reserved,

        available,

        mainStoreCurrent:
          Number(
            mainStoreStock.current || 0
          ),

        mainStoreReserved:
          Number(
            mainStoreStock.reserved || 0
          ),

        mainStoreAvailable:
          Number(
            mainStoreStock.available || 0
          ),
      };

    }, [
      locations,
      locationStock,
    ]);


  // =======================================================
  // LOCATION ACTIONS
  // =======================================================

  const handleCreate = () => {

    setEditingLocation(null);
    setFormOpen(true);
  };


  const handleEdit = (
    location
  ) => {

    setEditingLocation(
      location
    );

    setFormOpen(true);
  };


  const handleView = (
    location
  ) => {

    setSelectedLocation(
      location
    );

    setDetailsOpen(true);
  };


  const handleFormSuccess =
    async () => {

      setFormOpen(false);
      setEditingLocation(null);

      await fetchLocations(false);
    };


  // =======================================================
  // TOGGLE STATUS
  // =======================================================

  const handleToggleStatus =
    async (location) => {

      const nextStatus =
        !Boolean(
          location.is_active
        );


      const action =
        nextStatus
          ? "activate"
          : "deactivate";


      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} "${location.name}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setError("");


        const response =
          await api.patch(
            `/inventory-locations/${location.id}/status`
          );


        const updated =
          response.data?.data;


        await fetchLocations(false);


        if (
          selectedLocation &&
          selectedLocation.id === location.id
        ) {

          setSelectedLocation(
            (current) =>
              current
                ? {
                    ...current,

                    is_active:
                      updated?.isActive ??
                      updated?.is_active ??
                      nextStatus,
                  }
                : current
          );
        }

      } catch (err) {

        console.error(
          "Failed to update location status:",
          err
        );


        setError(
          err.response?.data?.message ||
          "Unable to update location status."
        );
      }
    };


  // =======================================================
  // PURCHASE DETAIL
  // =======================================================

  const handleOpenPurchase =
    (purchaseId) => {

      if (!purchaseId) {
        return;
      }


      setDetailsOpen(false);


      setSelectedPurchaseId(
        purchaseId
      );


      setPurchaseDetailsOpen(
        true
      );
    };


  const handleClosePurchase =
    () => {

      setPurchaseDetailsOpen(
        false
      );


      setSelectedPurchaseId(
        null
      );


      setDetailsOpen(
        true
      );
    };


  // =======================================================
  // TRANSFER DETAIL
  // =======================================================

  const handleOpenTransfer =
    (transferId) => {

      if (!transferId) {
        return;
      }


      setDetailsOpen(false);


      setSelectedTransferId(
        transferId
      );


      setTransferDetailsOpen(
        true
      );
    };


  const handleCloseTransfer =
    () => {

      setTransferDetailsOpen(
        false
      );


      setSelectedTransferId(
        null
      );


      setDetailsOpen(
        true
      );
    };


  // =======================================================
  // FILTER HELPERS
  // =======================================================

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL";


  const clearFilters = () => {

    setSearch("");
    setStatusFilter("ALL");
  };


  // =======================================================
  // SUMMARY CARDS
  // =======================================================

  const summaryCards = [

    {
      key: "locations",

      label:
        "Total Locations",

      value:
        summary.total,

      caption:
        `${summary.active} active · ${summary.inactive} inactive`,

      icon:
        MapPin,

      color:
        "violet",
    },

    {
      key: "main-store",

      label:
        "Main Store Stock",

      value:
        formatNumber(
          summary.mainStoreCurrent
        ),

      caption:
        "Current stock at Main Store",

      icon:
        Warehouse,

      color:
        "violet",
    },

    {
      key: "reserved",

      label:
        "Main Store Reserved",

      value:
        formatNumber(
          summary.mainStoreReserved
        ),

      caption:
        "Stock reserved for approved requests",

      icon:
        Package,

      color:
        "amber",
    },

    {
      key: "available",

      label:
        "Main Store Available",

      value:
        formatNumber(
          summary.mainStoreAvailable
        ),

      caption:
        "Available to fulfill kitchen requests",

      icon:
        CheckCircle2,

      color:
        "emerald",
    },
  ];


  const colorClasses = {

    violet: {
      bg:
        "bg-violet-50",

      text:
        "text-violet-600",
    },

    blue: {
      bg:
        "bg-blue-50",

      text:
        "text-blue-600",
    },

    amber: {
      bg:
        "bg-amber-50",

      text:
        "text-amber-600",
    },

    emerald: {
      bg:
        "bg-emerald-50",

      text:
        "text-emerald-600",
    },
  };


  // =======================================================
  // LOCATION CARD
  // =======================================================

  const renderLocationCard =
    (
      location,
      type
    ) => {

      const active =
        Boolean(
          location.is_active
        );


      const stock =
        locationStock[
          location.id
        ] || {};


      const mainStoreCard =
        type === "MAIN_STORE";


      return (

        <div
          key={location.id}
          className={`rounded-2xl border bg-white shadow-sm ${
            mainStoreCard
              ? "border-violet-200 ring-1 ring-violet-100"
              : "border-slate-200"
          }`}
        >

          {/* CARD HEADER */}

          <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">

            <div className="flex min-w-0 items-center gap-3">

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  mainStoreCard
                    ? "bg-violet-50 text-violet-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >

                {mainStoreCard ? (
                  <Warehouse size={20} />
                ) : (
                  <Store size={20} />
                )}

              </div>


              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      handleView(
                        location
                      )
                    }
                    className="truncate text-left text-base font-semibold text-slate-900 transition hover:text-violet-600"
                  >
                    {location.name}
                  </button>


                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      mainStoreCard
                        ? "bg-violet-50 text-violet-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {mainStoreCard
                      ? "MAIN_STORE"
                      : "KITCHEN"}
                  </span>


                  {active ? (

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">

                      <CheckCircle2
                        size={11}
                      />

                      ACTIVE

                    </span>

                  ) : (

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">

                      <XCircle
                        size={11}
                      />

                      INACTIVE

                    </span>

                  )}

                </div>


                <p className="mt-1 text-xs text-slate-400">

                  {location.description ||
                    (
                      mainStoreCard
                        ? "Central inventory receiving and supply location."
                        : "Kitchen inventory location."
                    )}

                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                handleView(
                  location
                )
              }
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-600 transition hover:bg-violet-50"
            >
              View Stock
            </button>

          </div>


          {/* STOCK */}

          <div
            className={`grid grid-cols-1 gap-3 p-5 ${
              mainStoreCard
                ? "sm:grid-cols-4"
                : "sm:grid-cols-3"
            }`}
          >

            {/* STOCK RECORDS */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Stock Records
              </p>


              <p className="mt-2 text-xl font-bold text-slate-900">
                {stock.ingredientCount ??
                  0}
              </p>


              <p className="mt-1 text-[10px] text-slate-400">
                Ingredients tracked
              </p>

            </div>


            {/* CURRENT */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Current Stock
              </p>


              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatNumber(
                  stock.current
                )}
              </p>


              <p className="mt-1 text-[10px] text-slate-400">
                Total physical stock
              </p>

            </div>


            {/* RESERVED — MAIN STORE ONLY */}

            {mainStoreCard && (

              <div className="rounded-xl bg-amber-50 p-4">

                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                  Reserved
                </p>


                <p className="mt-2 text-xl font-bold text-amber-600">
                  {formatNumber(
                    stock.reserved
                  )}
                </p>


                <p className="mt-1 text-[10px] text-amber-500">
                  Approved kitchen requests
                </p>

              </div>

            )}


            {/* AVAILABLE */}

            <div className="rounded-xl bg-emerald-50 p-4">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                Available
              </p>


              <p className="mt-2 text-xl font-bold text-emerald-600">
                {formatNumber(
                  stock.available
                )}
              </p>


              <p className="mt-1 text-[10px] text-emerald-500">
                {mainStoreCard
                  ? "Current minus reserved"
                  : "Kitchen stock available"}
              </p>

            </div>

          </div>


          {/* CARD ACTIONS */}

          {canManage && (

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">

              <button
                type="button"
                onClick={() =>
                  handleEdit(
                    location
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >

                <Edit3
                  size={13}
                />

                Edit

              </button>

            </div>

          )}

        </div>

      );
    };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div className="min-h-full bg-white">

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">

              <RefreshCw
                size={20}
                className="animate-spin"
              />

            </div>


            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading locations
            </p>


            <p className="mt-1 text-xs text-slate-400">
              Fetching locations and stock...
            </p>

          </div>

        </div>

      </div>

    );
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div className="min-h-full bg-white text-slate-900">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-2">

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventory Locations
            </h1>


            {refreshing && (

              <RefreshCw
                size={15}
                className="animate-spin text-violet-500"
              />

            )}

          </div>


          <p className="mt-1 text-sm text-slate-500">
            Main Store supplies the kitchens, while each kitchen manages its own received stock.
          </p>

        </div>


        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              fetchLocations(false)
            }
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>


          {canManage && (

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >

              <Plus
                size={16}
              />

              Add Location

            </button>

          )}

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">

          <XCircle
            size={18}
            className="mt-0.5 shrink-0 text-red-500"
          />


          <div>

            <p className="text-sm font-semibold text-red-700">
              Location operation failed
            </p>


            <p className="mt-0.5 text-xs text-red-600">
              {error}
            </p>

          </div>

        </div>

      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {summaryCards.map(
          ({
            key,
            label,
            value,
            caption,
            icon: Icon,
            color,
          }) => (

            <div
              key={key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >

              <div className="flex items-start justify-between">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses[color].bg} ${colorClasses[color].text}`}
                >

                  <Icon
                    size={19}
                  />

                </div>


                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClasses[color].bg} ${colorClasses[color].text}`}
                >
                  {label}
                </span>

              </div>


              <p className="mt-5 text-xs font-medium text-slate-500">
                {label}
              </p>


              <p className="mt-1 text-3xl font-bold text-slate-900">
                {value}
              </p>


              <p className="mt-1.5 text-xs text-slate-400">
                {caption}
              </p>

            </div>

          )
        )}

      </div>


      {/* =================================================
          FILTER BAR
      ================================================= */}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />


            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search locations..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
            />

          </div>


          <div className="flex flex-wrap items-center gap-3">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
            >

              <option value="ALL">
                All statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

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

      </div>


      {/* =================================================
          EMPTY
      ================================================= */}

      {filteredLocations.length === 0 && (

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">

          <MapPin
            size={28}
            className="mx-auto text-slate-300"
          />


          <p className="mt-4 text-sm font-semibold text-slate-700">
            No locations found
          </p>


          <p className="mt-1 text-xs text-slate-400">

            {hasActiveFilters
              ? "Try changing your search or filters."
              : "Create your first inventory location."}

          </p>


          {!hasActiveFilters &&
            canManage && (

              <button
                type="button"
                onClick={handleCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-100"
              >

                <Plus
                  size={14}
                />

                Add Location

              </button>

            )}

        </div>

      )}


      {/* =================================================
          MAIN STORE
      ================================================= */}

      {filteredLocations.length > 0 && (

        <>

          <section className="mt-6">

            <div className="mb-3 flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">

                <Warehouse
                  size={16}
                />

              </div>


              <div>

                <h2 className="text-sm font-bold text-slate-900">
                  Main Store
                </h2>


                <p className="text-[11px] text-slate-400">
                  Central supply location and source for kitchen transfers.
                </p>

              </div>

            </div>


            {mainStore ? (

              renderLocationCard(
                mainStore,
                "MAIN_STORE"
              )

            ) : (

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">

                <Warehouse
                  size={28}
                  className="mx-auto text-slate-300"
                />


                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Main Store not found
                </p>


                <p className="mt-1 text-xs text-slate-400">
                  No MAIN_STORE location matches the current filters.
                </p>

              </div>

            )}

          </section>


          {/* =================================================
              KITCHENS
          ================================================= */}

          <section className="mt-8">

            <div className="mb-3 flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">

                <Store
                  size={16}
                />

              </div>


              <div>

                <h2 className="text-sm font-bold text-slate-900">
                  Kitchens
                </h2>


                <p className="text-[11px] text-slate-400">
                  Kitchen locations receiving fulfilled stock transfers.
                </p>

              </div>

            </div>


            {kitchenLocations.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">

                <Store
                  size={28}
                  className="mx-auto text-slate-300"
                />


                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No kitchens found
                </p>


                <p className="mt-1 text-xs text-slate-400">

                  {hasActiveFilters
                    ? "Try changing your search or status filter."
                    : "Create kitchen locations to begin assigning inventory."}

                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                {kitchenLocations.map(
                  (location) =>
                    renderLocationCard(
                      location,
                      "KITCHEN"
                    )
                )}

              </div>

            )}

          </section>


          {/* =================================================
              LOCATION COUNT
          ================================================= */}

          <div className="mt-5 text-[11px] text-slate-400">

            Showing{" "}
            {filteredLocations.length}{" "}
            of{" "}
            {locations.length}{" "}
            locations

          </div>

        </>

      )}


      {/* =================================================
          LOCATION FORM MODAL
      ================================================= */}

      <LocationFormModal
        isOpen={
          formOpen
        }

        location={
          editingLocation
        }

        onClose={() => {

          setFormOpen(false);
          setEditingLocation(null);

        }}

        onSuccess={
          handleFormSuccess
        }
      />


      {/* =================================================
          LOCATION DETAILS MODAL
      ================================================= */}

      <LocationDetailsModal
        location={
          selectedLocation
        }

        isOpen={
          detailsOpen
        }

        canManage={
          canManage
        }

        onClose={() => {

          setDetailsOpen(false);
          setSelectedLocation(null);

        }}

        onEdit={(location) => {

          setDetailsOpen(false);

          setEditingLocation(
            location
          );

          setFormOpen(true);

        }}

        onToggleStatus={
          handleToggleStatus
        }

        onOpenPurchase={
          handleOpenPurchase
        }

        onOpenTransfer={
          handleOpenTransfer
        }
      />


      {/* =================================================
          PURCHASE DETAIL MODAL
      ================================================= */}

      <PurchaseDetailModal
        purchaseId={
          selectedPurchaseId
        }

        isOpen={
          purchaseDetailsOpen
        }

        onClose={
          handleClosePurchase
        }
      />


      {/* =================================================
          TRANSFER DETAIL MODAL
      ================================================= */}

      <TransferDetailModal
        transferId={
          selectedTransferId
        }

        isOpen={
          transferDetailsOpen
        }

        onClose={
          handleCloseTransfer
        }
      />

    </div>
  );
};


export default Locations;