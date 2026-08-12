import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Package,
  Search,
  XCircle,
} from "lucide-react";

import api from "../services/api";


const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");


  // =====================================================
  // LOAD INVENTORY DATA
  // =====================================================

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          inventoryResponse,
          ingredientsResponse,
          categoriesResponse,
        ] = await Promise.all([
          api.get("/inventory"),
          api.get("/ingredients"),
          api.get("/categories"),
        ]);

        setInventory(
          inventoryResponse.data?.data || []
        );

        setIngredients(
          ingredientsResponse.data?.data || []
        );

        setCategories(
          categoriesResponse.data?.data || []
        );
      } catch (err) {
        console.error(
          "Failed to load inventory:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load inventory."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);


  // =====================================================
  // INGREDIENT LOOKUP
  // =====================================================

  const ingredientMap = useMemo(() => {
    const map = {};

    ingredients.forEach((ingredient) => {
      map[ingredient.id] = ingredient;
    });

    return map;
  }, [ingredients]);


  // =====================================================
  // CATEGORY LOOKUP
  // =====================================================

  const categoryMap = useMemo(() => {
    const map = {};

    categories.forEach((category) => {
      map[category.id] = category;
    });

    return map;
  }, [categories]);


  // =====================================================
  // ENRICH INVENTORY DATA
  // =====================================================

  const enrichedInventory = useMemo(() => {
    return inventory.map((item) => {
      const ingredient =
        ingredientMap[item.ingredient_id];

      const category =
        ingredient
          ? categoryMap[ingredient.category_id]
          : null;

      return {
        ...item,

        ingredientName:
          item.ingredient ||
          ingredient?.name ||
          "Unknown ingredient",

        categoryId:
          ingredient?.category_id || null,

        categoryName:
          category?.name ||
          ingredient?.category ||
          "Uncategorized",

        locationName:
          item.location ||
          "Unknown location",
      };
    });
  }, [
    inventory,
    ingredientMap,
    categoryMap,
  ]);


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
  // STATUS CONFIGURATION
  // =====================================================

  const statusConfig = {
    HEALTHY: {
      label: "Healthy",
      icon: CheckCircle2,
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    },

    LOW: {
      label: "Low Stock",
      icon: AlertTriangle,
      className:
        "bg-amber-50 text-amber-700 ring-amber-600/10",
    },

    CRITICAL: {
      label: "Critical",
      icon: AlertTriangle,
      className:
        "bg-orange-50 text-orange-700 ring-orange-600/10",
    },

    OUT_OF_STOCK: {
      label: "Out of Stock",
      icon: XCircle,
      className:
        "bg-red-50 text-red-700 ring-red-600/10",
    },
  };


  // =====================================================
  // LOCATIONS
  // =====================================================

  const locations = useMemo(() => {
    const uniqueLocations = new Set();

    enrichedInventory.forEach((item) => {
      if (item.locationName) {
        uniqueLocations.add(item.locationName);
      }
    });

    return Array.from(uniqueLocations).sort();
  }, [enrichedInventory]);


  // =====================================================
  // FILTERED INVENTORY
  // =====================================================

  const filteredInventory = useMemo(() => {
    const searchTerm =
      search.trim().toLowerCase();

    return enrichedInventory.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.ingredientName
          .toLowerCase()
          .includes(searchTerm) ||
        (item.sku || "")
          .toLowerCase()
          .includes(searchTerm) ||
        item.categoryName
          .toLowerCase()
          .includes(searchTerm) ||
        item.locationName
          .toLowerCase()
          .includes(searchTerm);

      const status =
        getStockStatus(item);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" ||
        String(item.categoryId) ===
          String(categoryFilter);

      const matchesLocation =
        locationFilter === "ALL" ||
        item.locationName === locationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesLocation
      );
    });
  }, [
    enrichedInventory,
    search,
    statusFilter,
    categoryFilter,
    locationFilter,
  ]);


  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    let healthy = 0;
    let low = 0;
    let critical = 0;
    let outOfStock = 0;

    enrichedInventory.forEach((item) => {
      const status = getStockStatus(item);

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
      total: enrichedInventory.length,
      healthy,
      low,
      critical,
      outOfStock,
    };
  }, [enrichedInventory]);


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-7">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          Stock Management
        </p>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Inventory
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor ingredients, stock levels,
              categories and storage locations
              from one place.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-500">
            {enrichedInventory.length} inventory records
          </div>

        </div>
      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL */}

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Package size={21} />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total
            </span>

          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            {summary.total}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Inventory records
          </p>

        </div>


        {/* HEALTHY */}

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={21} />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Healthy
            </span>

          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            {summary.healthy}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Well stocked
          </p>

        </div>


        {/* ATTENTION */}

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle size={21} />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Attention
            </span>

          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            {summary.low + summary.critical}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Need attention
          </p>

        </div>


        {/* OUT OF STOCK */}

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <XCircle size={21} />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Urgent
            </span>

          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            {summary.outOfStock}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Out of stock
          </p>

        </div>

      </div>


      {/* =================================================
          INVENTORY TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">

        {/* FILTER BAR */}

        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">

          {/* SEARCH */}

          <div className="relative w-full xl:max-w-md">

            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search ingredient, SKU, category or location..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

          </div>


          {/* FILTERS */}

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* CATEGORY */}

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >

              <option value="ALL">
                All categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}

            </select>


            {/* LOCATION */}

            <select
              value={locationFilter}
              onChange={(event) =>
                setLocationFilter(event.target.value)
              }
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >

              <option value="ALL">
                All locations
              </option>

              {locations.map((location) => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              ))}

            </select>


            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >

              <option value="ALL">
                All stock
              </option>

              <option value="HEALTHY">
                Healthy
              </option>

              <option value="LOW">
                Low stock
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="OUT_OF_STOCK">
                Out of stock
              </option>

            </select>

          </div>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="p-14 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading inventory...
            </p>

          </div>
        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="p-14 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <XCircle size={22} />
            </div>

            <p className="mt-4 font-semibold text-slate-800">
              Unable to load inventory
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {error}
            </p>

          </div>
        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredInventory.length === 0 && (
            <div className="p-14 text-center">

              <Package
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-semibold text-slate-800">
                No inventory found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

            </div>
          )}


        {/* =================================================
            TABLE
        ================================================= */}

        {!loading &&
          !error &&
          filteredInventory.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50/70">

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Ingredient
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Category
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Location
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Available
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Reserved
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredInventory.map((item) => {
                    const status =
                      getStockStatus(item);

                    const config =
                      statusConfig[status];

                    const StatusIcon =
                      config.icon;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-50 transition-colors hover:bg-slate-50/70"
                      >

                        {/* INGREDIENT */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 font-bold text-blue-600">
                              {item.ingredientName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-800">
                                {item.ingredientName}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {item.sku
                                  ? `SKU: ${item.sku}`
                                  : "No SKU"}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* CATEGORY */}

                        <td className="px-6 py-5">

                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            {item.categoryName}
                          </span>

                        </td>


                        {/* LOCATION */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">

                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                              <MapPin size={15} />
                            </div>

                            <span>
                              {item.locationName}
                            </span>

                          </div>

                        </td>


                        {/* AVAILABLE */}

                        <td className="px-6 py-5">

                          <span className="font-bold text-slate-800">
                            {Number(
                              item.available_quantity ?? 0
                            ).toLocaleString()}
                          </span>

                          <span className="ml-1 text-xs text-slate-400">
                            {item.unit}
                          </span>

                        </td>


                        {/* RESERVED */}

                        <td className="px-6 py-5">

                          <span className="font-medium text-slate-600">
                            {Number(
                              item.reserved_quantity ?? 0
                            ).toLocaleString()}
                          </span>

                          <span className="ml-1 text-xs text-slate-400">
                            {item.unit}
                          </span>

                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}
                          >

                            <StatusIcon size={14} />

                            {config.label}

                          </span>

                        </td>


                        {/* ACTION */}

                        <td className="px-6 py-5 text-right">

                          <button
                            type="button"
                            className="rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            View
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

      </div>

    </div>
  );
};


export default Inventory;