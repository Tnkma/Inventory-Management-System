import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  XCircle,
  Truck,
  Clock3,
} from "lucide-react";

import api from "../services/api";
import InventoryDetailModal from "../components/InventoryDetailModal";


const STATUS_CONFIG = {
  HEALTHY: {
    label: "Healthy",
    icon: CheckCircle2,
    badge: "bg-emerald-50 text-emerald-600",
  },

  LOW: {
    label: "Low Stock",
    icon: AlertTriangle,
    badge: "bg-amber-50 text-amber-600",
  },

  CRITICAL: {
    label: "Critical",
    icon: AlertTriangle,
    badge: "bg-orange-50 text-orange-600",
  },

  OUT_OF_STOCK: {
    label: "Out of Stock",
    icon: XCircle,
    badge: "bg-red-50 text-red-600",
  },
};


const Inventory = () => {

  const [inventory, setInventory] =
    useState([]);

  const [ingredients, setIngredients] =
    useState([]);

  const [categories, setCategories] =
    useState([]);


  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [locationFilter, setLocationFilter] =
    useState("ALL");


  const [selectedInventory, setSelectedInventory] =
    useState(null);


  // =========================================================
  // LOAD INVENTORY DATA
  // =========================================================

  const fetchInventoryData = async (
    showInitialLoading = true
  ) => {

    try {

      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

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
      setRefreshing(false);

    }
  };


  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================

  useEffect(() => {

    fetchInventoryData(true);


    const handleWindowFocus = () => {

      fetchInventoryData(false);

    };


    const handleVisibilityChange = () => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        fetchInventoryData(false);

      }

    };


    window.addEventListener(
      "focus",
      handleWindowFocus
    );


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    const interval =
      setInterval(() => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          fetchInventoryData(false);

        }

      }, 30000);


    return () => {

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      clearInterval(interval);

    };

  }, []);


  // =========================================================
  // LOOKUPS
  // =========================================================

  const ingredientMap = useMemo(() => {

    const map = {};

    ingredients.forEach(
      (ingredient) => {

        map[ingredient.id] =
          ingredient;

      }
    );

    return map;

  }, [ingredients]);


  const categoryMap = useMemo(() => {

    const map = {};

    categories.forEach(
      (category) => {

        map[category.id] =
          category;

      }
    );

    return map;

  }, [categories]);


  // =========================================================
  // ENRICH INVENTORY
  // =========================================================

  const enrichedInventory = useMemo(() => {

    return inventory.map((item) => {

      const ingredient =
        ingredientMap[
          item.ingredient_id
        ];


      const category =
        ingredient
          ? categoryMap[
              ingredient.category_id
            ]
          : null;


      const onHand =
        Number(
          item.current_quantity ?? 0
        );


      const reserved =
        Number(
          item.reserved_quantity ?? 0
        );


      const available =
        Number(
          item.available_quantity ??
          onHand - reserved
        );


      return {

        ...item,


        ingredientName:
          item.ingredient ||
          ingredient?.name ||
          "Unknown ingredient",


        categoryId:
          ingredient?.category_id ||
          null,


        categoryName:
          category?.name ||
          ingredient?.category ||
          "Uncategorized",


        locationName:
          item.location ||
          "Unknown location",


        supplierName:
          item.last_supplier ||
          "No purchase history",


        onHand,

        reserved,

        available,


        lastPurchaseId:
          item.last_purchase_id ||
          null,


        lastPurchaseDate:
          item.last_purchase_date ||
          null,

      };

    });

  }, [
    inventory,
    ingredientMap,
    categoryMap,
  ]);


  // =========================================================
  // STOCK STATUS
  // =========================================================

  const getStockStatus = (item) => {

    const available =
      Number(
        item.available ?? 0
      );


    const minimum =
      Number(
        item.minimum_stock ?? 0
      );


    const reorder =
      Number(
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


  // =========================================================
  // LOCATIONS
  // =========================================================

  const locations = useMemo(() => {

    const uniqueLocations =
      new Set();


    enrichedInventory.forEach(
      (item) => {

        if (item.locationName) {

          uniqueLocations.add(
            item.locationName
          );

        }

      }
    );


    return Array.from(
      uniqueLocations
    ).sort();

  }, [enrichedInventory]);


  // =========================================================
  // FILTERED INVENTORY
  // =========================================================

  const filteredInventory = useMemo(() => {

    const searchTerm =
      search
        .trim()
        .toLowerCase();


    return enrichedInventory.filter(
      (item) => {

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
            .includes(searchTerm) ||

          item.supplierName
            .toLowerCase()
            .includes(searchTerm);


        const status =
          getStockStatus(item);


        const matchesStatus =
          statusFilter === "ALL" ||
          status === statusFilter;


        const matchesCategory =
          categoryFilter === "ALL" ||
          String(
            item.categoryId
          ) ===
            String(
              categoryFilter
            );


        const matchesLocation =
          locationFilter === "ALL" ||
          item.locationName ===
            locationFilter;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesLocation
        );

      }
    );

  }, [
    enrichedInventory,
    search,
    statusFilter,
    categoryFilter,
    locationFilter,
  ]);


  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {

    let healthy = 0;
    let low = 0;
    let critical = 0;
    let outOfStock = 0;


    enrichedInventory.forEach(
      (item) => {

        const status =
          getStockStatus(item);


        if (
          status === "HEALTHY"
        ) {
          healthy++;
        }


        if (
          status === "LOW"
        ) {
          low++;
        }


        if (
          status === "CRITICAL"
        ) {
          critical++;
        }


        if (
          status ===
          "OUT_OF_STOCK"
        ) {
          outOfStock++;
        }

      }
    );


    const totalOnHand =
      enrichedInventory.reduce(
        (total, item) =>
          total +
          Number(
            item.onHand ?? 0
          ),
        0
      );


    const totalReserved =
      enrichedInventory.reduce(
        (total, item) =>
          total +
          Number(
            item.reserved ?? 0
          ),
        0
      );


    const totalAvailable =
      enrichedInventory.reduce(
        (total, item) =>
          total +
          Number(
            item.available ?? 0
          ),
        0
      );


    return {

      total:
        enrichedInventory.length,

      healthy,

      low,

      critical,

      outOfStock,

      totalOnHand,

      totalReserved,

      totalAvailable,

    };

  }, [enrichedInventory]);


  // =========================================================
  // ACTIONS
  // =========================================================

  const handleViewInventory =
    (item) => {

      setSelectedInventory(
        item
      );

    };


  const handleCloseDetails =
    () => {

      setSelectedInventory(
        null
      );

    };


  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    locationFilter !== "ALL";


  const clearFilters = () => {

    setSearch("");

    setStatusFilter("ALL");

    setCategoryFilter("ALL");

    setLocationFilter("ALL");

  };


  // =========================================================
  // FORMAT
  // =========================================================

  const formatNumber = (
    value
  ) => {

    return Number(
      value || 0
    ).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 3,
      }
    );

  };


  const formatDate = (
    value
  ) => {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

    }


    return date.toLocaleString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  // =========================================================
  // STAT CARDS
  // =========================================================

  const statCards = [

    {
      key: "total",

      label:
        "Inventory Records",

      value:
        summary.total,

      caption:
        "Ingredient/location records",

      badge:
        "Tracked",

      icon:
        Package,

      color:
        "blue",
    },


    {
      key: "onHand",

      label:
        "Total On Hand",

      value:
        formatNumber(
          summary.totalOnHand
        ),

      caption:
        "Physical stock across locations",

      badge:
        "Physical",

      icon:
        Package,

      color:
        "violet",
    },


    {
      key: "reserved",

      label:
        "Reserved Stock",

      value:
        formatNumber(
          summary.totalReserved
        ),

      caption:
        "Stock already allocated",

      badge:
        "Reserved",

      icon:
        Clock3,

      color:
        "amber",
    },


    {
      key: "available",

      label:
        "Available Stock",

      value:
        formatNumber(
          summary.totalAvailable
        ),

      caption:
        "Stock available for use",

      badge:
        "Available",

      icon:
        CheckCircle2,

      color:
        "emerald",
    },

  ];


  const colorClasses = {

    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
    },

    violet: {
      bg: "bg-violet-50",
      text: "text-violet-600",
    },

    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },

    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
    },

  };


  const selectClasses =
    `
      h-10
      rounded-xl
      border
      border-slate-200
      bg-white
      px-3.5
      text-sm
      font-medium
      text-slate-600
      outline-none
      transition
      focus:border-blue-300
      focus:ring-4
      focus:ring-blue-500/10
    `;


  // =========================================================
  // INITIAL LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="min-h-full bg-white">

        <div className="
          flex
          min-h-[500px]
          items-center
          justify-center
        ">

          <div className="text-center">

            <div className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-blue-50
              text-blue-600
            ">

              <RefreshCw
                size={20}
                className="animate-spin"
              />

            </div>


            <p className="
              mt-4
              text-sm
              font-semibold
              text-slate-700
            ">
              Loading inventory
            </p>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Fetching your stock records...
            </p>

          </div>

        </div>

      </div>

    );

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="
      min-h-full
      bg-white
      text-slate-900
    ">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="
        mb-7
        flex
        flex-col
        gap-5
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">

        <div>

          <div className="
            flex
            items-center
            gap-2
          ">

            <h1 className="
              text-2xl
              font-bold
              tracking-tight
              text-slate-900
            ">
              Inventory
            </h1>


            {refreshing && (

              <RefreshCw
                size={15}
                className="
                  animate-spin
                  text-blue-500
                "
              />

            )}

          </div>


          <p className="
            mt-1
            text-sm
            text-slate-500
          ">
            Monitor stock across stores and
            operational locations.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            fetchInventoryData(false)
          }
          disabled={refreshing}
          className="
            inline-flex
            h-10
            items-center
            gap-2
            self-start
            rounded-xl
            border
            border-slate-200
            bg-white
            px-3.5
            text-sm
            font-medium
            text-slate-600
            shadow-sm
            transition
            hover:border-slate-300
            hover:bg-slate-50
            hover:text-slate-900
            disabled:cursor-not-allowed
            disabled:opacity-60
            sm:self-auto
          "
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

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="
          mb-6
          flex
          items-start
          gap-3
          rounded-2xl
          border
          border-red-100
          bg-red-50
          px-4
          py-3.5
        ">

          <XCircle
            size={18}
            className="
              mt-0.5
              shrink-0
              text-red-500
            "
          />


          <div>

            <p className="
              text-sm
              font-semibold
              text-red-700
            ">
              Inventory data could not be loaded
            </p>


            <p className="
              mt-0.5
              text-xs
              text-red-600
            ">
              {error}
            </p>

          </div>

        </div>

      )}


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-4
      ">

        {statCards.map(
          ({
            key,
            label,
            value,
            caption,
            badge,
            icon: Icon,
            color,
          }) => (

            <div
              key={key}
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >

              <div className="
                flex
                items-start
                justify-between
              ">

                <div className={`
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  ${colorClasses[color].bg}
                  ${colorClasses[color].text}
                `}>

                  <Icon size={19} />

                </div>


                <span className={`
                  rounded-full
                  px-2.5
                  py-1
                  text-[11px]
                  font-semibold
                  ${colorClasses[color].bg}
                  ${colorClasses[color].text}
                `}>

                  {badge}

                </span>

              </div>


              <div className="mt-5">

                <p className="
                  text-xs
                  font-medium
                  text-slate-500
                ">
                  {label}
                </p>


                <p className="
                  mt-1
                  text-3xl
                  font-bold
                  tracking-tight
                  text-slate-900
                ">
                  {value}
                </p>


                <p className="
                  mt-1.5
                  text-xs
                  text-slate-400
                ">
                  {caption}
                </p>

              </div>

            </div>

          )
        )}

      </div>


      {/* =====================================================
          INVENTORY TABLE
      ===================================================== */}

      <div className="
        mt-5
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      ">

        {/* FILTER BAR */}

        <div className="
          flex
          flex-col
          gap-4
          border-b
          border-slate-100
          p-5
          xl:flex-row
          xl:items-center
          xl:justify-between
        ">

          <div className="
            relative
            w-full
            xl:max-w-md
          ">

            <Search
              size={16}
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />


            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="
                Search ingredient, SKU,
                category, location or supplier...
              "
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                pl-10
                pr-4
                text-sm
                outline-none
                transition
                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-500/10
              "
            />

          </div>


          <div className="
            flex
            flex-wrap
            items-center
            gap-3
          ">

            {/* CATEGORY */}

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className={selectClasses}
            >

              <option value="ALL">
                All categories
              </option>


              {categories.map(
                (category) => (

                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>

                )
              )}

            </select>


            {/* LOCATION */}

            <select
              value={locationFilter}
              onChange={(event) =>
                setLocationFilter(
                  event.target.value
                )
              }
              className={selectClasses}
            >

              <option value="ALL">
                All locations
              </option>


              {locations.map(
                (location) => (

                  <option
                    key={location}
                    value={location}
                  >
                    {location}
                  </option>

                )
              )}

            </select>


            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className={selectClasses}
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


            {hasActiveFilters && (

              <button
                type="button"
                onClick={clearFilters}
                className="
                  h-10
                  rounded-xl
                  px-3
                  text-xs
                  font-semibold
                  text-blue-600
                  transition
                  hover:bg-blue-50
                "
              >
                Clear filters
              </button>

            )}

          </div>

        </div>


        {/* ===================================================
            EMPTY
        =================================================== */}

        {filteredInventory.length === 0 && (

          <div className="
            p-14
            text-center
          ">

            <Package
              size={28}
              className="
                mx-auto
                text-slate-300
              "
            />


            <p className="
              mt-4
              text-sm
              font-semibold
              text-slate-700
            ">
              No inventory found
            </p>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Try changing your search or filters.
            </p>

          </div>

        )}


        {/* ===================================================
            TABLE
        =================================================== */}

        {filteredInventory.length > 0 && (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="
                  border-b
                  border-slate-100
                  bg-slate-50/60
                ">

                  <th className="
                    px-6
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Ingredient
                  </th>


                  <th className="
                    px-6
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Category
                  </th>


                  <th className="
                    px-6
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Location
                  </th>


                  <th className="
                    px-6
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    On Hand
                  </th>


                  <th className="
                    px-6
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Reserved
                  </th>


                  <th className="
                    px-6
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Available
                  </th>


                  <th className="
                    px-6
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Last Supplier
                  </th>


                  <th className="
                    px-6
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Status
                  </th>


                  <th className="
                    px-6
                    py-3.5
                    text-right
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredInventory.map(
                  (item) => {

                    const status =
                      getStockStatus(
                        item
                      );


                    const config =
                      STATUS_CONFIG[
                        status
                      ];


                    const StatusIcon =
                      config.icon;


                    return (

                      <tr
                        key={item.id}
                        className="
                          border-b
                          border-slate-50
                          transition-colors
                          last:border-0
                          hover:bg-slate-50/70
                        "
                      >

                        {/* INGREDIENT */}

                        <td className="
                          px-6
                          py-4
                        ">

                          <div className="
                            flex
                            items-center
                            gap-3
                          ">

                            <div className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-blue-50
                              text-sm
                              font-bold
                              text-blue-600
                            ">

                              {item.ingredientName
                                .charAt(0)
                                .toUpperCase()}

                            </div>


                            <div className="
                              min-w-0
                            ">

                              <button
                                type="button"
                                onClick={() =>
                                  handleViewInventory(
                                    item
                                  )
                                }
                                className="
                                  truncate
                                  text-left
                                  text-sm
                                  font-semibold
                                  text-slate-800
                                  transition
                                  hover:text-blue-600
                                "
                              >
                                {item.ingredientName}
                              </button>


                              <p className="
                                mt-0.5
                                text-[11px]
                                text-slate-400
                              ">
                                {item.sku
                                  ? `SKU: ${item.sku}`
                                  : "No SKU"}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* CATEGORY */}

                        <td className="
                          px-6
                          py-4
                        ">

                          <span className="
                            inline-flex
                            rounded-full
                            bg-slate-100
                            px-2.5
                            py-1
                            text-[11px]
                            font-semibold
                            text-slate-600
                          ">
                            {item.categoryName}
                          </span>

                        </td>


                        {/* LOCATION */}

                        <td className="
                          px-6
                          py-4
                        ">

                          <div className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            font-medium
                            text-slate-700
                          ">

                            <div className="
                              flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              rounded-lg
                              bg-violet-50
                              text-violet-600
                            ">

                              <MapPin
                                size={13}
                              />

                            </div>


                            <span className="
                              truncate
                            ">
                              {item.locationName}
                            </span>

                          </div>

                        </td>


                        {/* ON HAND */}

                        <td className="
                          px-6
                          py-4
                        ">

                          <span className="
                            text-sm
                            font-semibold
                            text-slate-800
                          ">
                            {formatNumber(
                              item.onHand
                            )}
                          </span>


                          <span className="
                            ml-1
                            text-[11px]
                            text-slate-400
                          ">
                            {item.unit}
                          </span>

                        </td>


                        {/* RESERVED */}

                        <td className="
                          px-6
                          py-4
                        ">

                          {item.reserved > 0 ? (

                            <div>

                              <span className="
                                text-sm
                                font-semibold
                                text-amber-600
                              ">
                                {formatNumber(
                                  item.reserved
                                )}
                              </span>


                              <span className="
                                ml-1
                                text-[11px]
                                text-slate-400
                              ">
                                {item.unit}
                              </span>

                            </div>

                          ) : (

                            <span className="
                              text-sm
                              font-medium
                              text-slate-400
                            ">
                              0
                            </span>

                          )}

                        </td>


                        {/* AVAILABLE */}

                        <td className="
                          px-6
                          py-4
                        ">

                          <span className="
                            text-sm
                            font-semibold
                            text-emerald-700
                          ">
                            {formatNumber(
                              item.available
                            )}
                          </span>


                          <span className="
                            ml-1
                            text-[11px]
                            text-slate-400
                          ">
                            {item.unit}
                          </span>

                        </td>


                        {/* SUPPLIER */}

                        <td className="
                          px-6
                          py-4
                        ">

                          {item.last_supplier ? (

                            <div>

                              <div className="
                                flex
                                items-center
                                gap-2
                              ">

                                <Truck
                                  size={14}
                                  className="
                                    shrink-0
                                    text-slate-400
                                  "
                                />


                                <p className="
                                  max-w-[150px]
                                  truncate
                                  text-sm
                                  font-medium
                                  text-slate-700
                                ">
                                  {item.last_supplier}
                                </p>

                              </div>


                              {item.last_purchase_id && (

                                <p className="
                                  mt-1
                                  text-[10px]
                                  text-slate-400
                                ">
                                  Purchase #
                                  {item.last_purchase_id}
                                </p>

                              )}

                            </div>

                          ) : (

                            <span className="
                              text-xs
                              text-slate-400
                            ">
                              No purchase history
                            </span>

                          )}

                        </td>


                        {/* STATUS */}

                        <td className="
                          px-6
                          py-4
                        ">

                          <span className={`
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            px-2.5
                            py-1
                            text-[11px]
                            font-semibold
                            ${config.badge}
                          `}>

                            <StatusIcon
                              size={13}
                            />

                            {config.label}

                          </span>

                        </td>


                        {/* ACTION */}

                        <td className="
                          px-6
                          py-4
                          text-right
                        ">

                          <button
                            type="button"
                            onClick={() =>
                              handleViewInventory(
                                item
                              )
                            }
                            className="
                              rounded-lg
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              text-blue-600
                              transition
                              hover:bg-blue-50
                            "
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}


        {/* ===================================================
            FOOTER
        =================================================== */}

        {filteredInventory.length > 0 && (

          <div className="
            border-t
            border-slate-100
            px-6
            py-3.5
            text-[11px]
            text-slate-400
          ">

            Showing{" "}
            {filteredInventory.length}{" "}
            of{" "}
            {enrichedInventory.length}{" "}
            inventory records

          </div>

        )}

      </div>


      {/* =====================================================
          INVENTORY DETAIL MODAL
      ===================================================== */}

      {selectedInventory && (

        <InventoryDetailModal
          item={selectedInventory}
          onClose={
            handleCloseDetails
          }
        />

      )}

    </div>

  );

};


export default Inventory;