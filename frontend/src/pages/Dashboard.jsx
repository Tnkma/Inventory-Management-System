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
  ChevronRight,
  RefreshCw,
  XCircle,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Clock3,
  CircleAlert,
  Activity,
  Warehouse,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

import api from "../services/api";


// =========================================================
// HELPERS
// =========================================================

const formatNumber = (value) => {

  return Number(value || 0).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 3,
    }
  );

};


const formatDate = (value) => {

  if (!value) {
    return "—";
  }


  const date = new Date(value);


  if (Number.isNaN(date.getTime())) {
    return "—";
  }


  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

};


// =========================================================
// COMPONENT
// =========================================================

const Dashboard = () => {

  const navigate = useNavigate();


  // =======================================================
  // STATE
  // =======================================================

  const [inventory, setInventory] = useState([]);

  const [movements, setMovements] = useState([]);

  const [purchases, setPurchases] = useState([]);

  const [notifications, setNotifications] = useState([]);


  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");


  // =======================================================
  // FETCH DASHBOARD DATA
  // =======================================================

  const fetchDashboardData = async (
    showInitialLoading = true
  ) => {

    try {

      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }


      setError("");


      const results =
        await Promise.allSettled([
          api.get("/inventory"),
          api.get("/inventory/movements"),
          api.get("/purchases"),
          api.get("/notifications"),
        ]);


      const [
        inventoryResult,
        movementsResult,
        purchasesResult,
        notificationsResult,
      ] = results;


      // ---------------------------------------------------
      // INVENTORY
      // ---------------------------------------------------

      if (
        inventoryResult.status ===
        "fulfilled"
      ) {

        setInventory(
          inventoryResult.value.data?.data ||
          []
        );

      } else {

        console.error(
          "Failed to load inventory:",
          inventoryResult.reason
        );

      }


      // ---------------------------------------------------
      // MOVEMENTS
      // ---------------------------------------------------

      if (
        movementsResult.status ===
        "fulfilled"
      ) {

        setMovements(
          movementsResult.value.data?.data ||
          []
        );

      } else {

        console.error(
          "Failed to load movements:",
          movementsResult.reason
        );

      }


      // ---------------------------------------------------
      // PURCHASES
      // ---------------------------------------------------

      if (
        purchasesResult.status ===
        "fulfilled"
      ) {

        setPurchases(
          purchasesResult.value.data?.data ||
          []
        );

      } else {

        console.error(
          "Failed to load purchases:",
          purchasesResult.reason
        );

      }


      // ---------------------------------------------------
      // NOTIFICATIONS
      // ---------------------------------------------------

      if (
        notificationsResult.status ===
        "fulfilled"
      ) {

        setNotifications(
          notificationsResult.value.data?.data ||
          []
        );

      } else {

        console.error(
          "Failed to load notifications:",
          notificationsResult.reason
        );

      }


      if (
        inventoryResult.status ===
        "rejected"
      ) {

        setError(
          inventoryResult.reason?.response?.data?.message ||
          "Unable to load dashboard inventory data."
        );

      }

    } catch (err) {

      console.error(
        "Dashboard loading error:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to load dashboard data."
      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    fetchDashboardData(true);

  }, []);


  // =======================================================
  // STOCK STATUS
  // =======================================================

  const getStockStatus = (item) => {

    const available =
      Number(
        item.available_quantity ?? 0
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


  // =======================================================
  // INVENTORY SUMMARY
  // =======================================================

  const inventorySummary =
    useMemo(() => {

      let healthy = 0;

      let low = 0;

      let critical = 0;

      let outOfStock = 0;

      let availableQuantity = 0;

      let reservedQuantity = 0;


      inventory.forEach((item) => {

        const status =
          getStockStatus(item);


        if (status === "HEALTHY") {
          healthy += 1;
        }


        if (status === "LOW") {
          low += 1;
        }


        if (status === "CRITICAL") {
          critical += 1;
        }


        if (
          status === "OUT_OF_STOCK"
        ) {
          outOfStock += 1;
        }


        availableQuantity +=
          Number(
            item.available_quantity ?? 0
          );


        reservedQuantity +=
          Number(
            item.reserved_quantity ?? 0
          );

      });


      return {

        total: inventory.length,

        healthy,

        low,

        critical,

        outOfStock,

        attention:
          low +
          critical +
          outOfStock,

        availableQuantity,

        reservedQuantity,

      };

    }, [inventory]);


  // =======================================================
  // STOCK HEALTH
  // =======================================================

  const healthPercentage =
    inventorySummary.total > 0
      ? Math.round(
          (
            inventorySummary.healthy /
            inventorySummary.total
          ) * 100
        )
      : 0;


  // =======================================================
  // LOW STOCK
  // =======================================================

  const lowStockItems =
    useMemo(() => {

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
            Number(
              a.available_quantity ?? 0
            ) -
            Number(
              b.available_quantity ?? 0
            )
        )
        .slice(0, 6);

    }, [inventory]);


  // =======================================================
  // PURCHASE SUMMARY
  // =======================================================

  const purchaseSummary =
    useMemo(() => {

      let pending = 0;

      let completed = 0;

      let cancelled = 0;


      purchases.forEach((purchase) => {

        const status =
          String(
            purchase.status || ""
          ).toUpperCase();


        if (status === "PENDING") {
          pending += 1;
        }


        if (status === "COMPLETED") {
          completed += 1;
        }


        if (status === "CANCELLED") {
          cancelled += 1;
        }

      });


      return {
        total: purchases.length,
        pending,
        completed,
        cancelled,
      };

    }, [purchases]);


  // =======================================================
  // NOTIFICATIONS
  // =======================================================

  const unreadNotifications =
    useMemo(() => {

      return notifications.filter(
        (notification) =>
          !notification.is_read
      );

    }, [notifications]);


  // =======================================================
  // RECENT ACTIVITY
  // =======================================================

  const recentActivity =
    useMemo(() => {

      return [...movements]
        .sort(
          (a, b) =>
            new Date(
              b.created_at || 0
            ).getTime() -
            new Date(
              a.created_at || 0
            ).getTime()
        )
        .slice(0, 7);

    }, [movements]);


  // =======================================================
  // MOVEMENT HELPERS
  // =======================================================

  const isPositiveMovement =
    (movementType) => {

      const type =
        String(
          movementType || ""
        ).toUpperCase();


      return (
        type === "PURCHASE" ||
        type === "RETURN"
      );

    };


  const getMovementIcon =
    (movementType) => {

      return isPositiveMovement(
        movementType
      )
        ? ArrowUpRight
        : ArrowDownRight;

    };


  const getMovementStyle =
    (movementType) => {

      const type =
        String(
          movementType || ""
        ).toUpperCase();


      if (type === "PURCHASE") {

        return {
          bg: "bg-blue-50",
          text: "text-blue-600",
        };

      }


      if (type === "CONSUMPTION") {

        return {
          bg: "bg-violet-50",
          text: "text-violet-600",
        };

      }


      if (type === "WASTAGE") {

        return {
          bg: "bg-red-50",
          text: "text-red-600",
        };

      }


      if (type === "TRANSFER") {

        return {
          bg: "bg-amber-50",
          text: "text-amber-600",
        };

      }


      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
      };

    };


  // =======================================================
  // RELATIVE TIME
  // =======================================================

  const formatRelativeTime =
    (dateValue) => {

      if (!dateValue) {
        return "Recently";
      }


      const date =
        new Date(dateValue);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "Recently";
      }


      const now =
        new Date();


      const difference =
        Math.floor(
          (
            now.getTime() -
            date.getTime()
          ) / 1000
        );


      if (difference < 60) {
        return "Just now";
      }


      const minutes =
        Math.floor(
          difference / 60
        );


      if (minutes < 60) {
        return `${minutes}m ago`;
      }


      const hours =
        Math.floor(
          minutes / 60
        );


      if (hours < 24) {
        return `${hours}h ago`;
      }


      const days =
        Math.floor(
          hours / 24
        );


      if (days < 7) {
        return `${days}d ago`;
      }


      return date.toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "short",
        }
      );

    };


  // =======================================================
  // DATE
  // =======================================================

  const currentDate =
    new Date().toLocaleDateString(
      undefined,
      {
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    );


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div className="
        min-h-full
        bg-white
      ">

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
              Loading dashboard
            </p>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Fetching your latest inventory data...
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

    <div className="
      min-h-full
      bg-white
      text-slate-900
    ">


      {/* =================================================
          HEADER
      ================================================= */}

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
              Overview
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
            Monitor your restaurant inventory and stock activity.
          </p>


          <p className="
            mt-1.5
            text-xs
            font-medium
            text-slate-400
          ">
            {currentDate}
          </p>

        </div>


        <div className="
          flex
          items-center
          gap-2
        ">

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              fetchDashboardData(false)
            }
            disabled={refreshing}
            className="
              inline-flex
              h-10
              items-center
              gap-2
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


          {/* REPORT LINK */}

          <button
            type="button"
            onClick={() =>
              navigate("/reports")
            }
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-xl
              bg-blue-600
              px-4
              text-sm
              font-semibold
              text-white
              shadow-sm
              shadow-blue-600/20
              transition
              hover:bg-blue-700
              hover:shadow-md
            "
          >

            <BarChart3 size={17} />

            View Reports

          </button>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

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
              Dashboard data could not be fully loaded
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


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-4
      ">


        {/* INGREDIENTS */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          transition
          hover:-translate-y-0.5
          hover:shadow-md
        ">

          <div className="
            flex
            items-start
            justify-between
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-blue-50
              text-blue-600
            ">

              <Package size={19} />

            </div>


            <span className="
              rounded-full
              bg-blue-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-blue-600
            ">
              Active
            </span>

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Total Ingredients
          </p>


          <p className="
            mt-1
            text-3xl
            font-bold
            tracking-tight
          ">
            {inventorySummary.total}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Currently tracked in inventory
          </p>

        </div>


        {/* ATTENTION */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          transition
          hover:-translate-y-0.5
          hover:shadow-md
        ">

          <div className="
            flex
            items-start
            justify-between
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-amber-50
              text-amber-600
            ">

              <AlertTriangle size={19} />

            </div>


            <span className="
              rounded-full
              bg-amber-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-amber-600
            ">
              Attention
            </span>

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Stock Attention
          </p>


          <p className="
            mt-1
            text-3xl
            font-bold
          ">
            {inventorySummary.attention}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            {inventorySummary.outOfStock} items out of stock
          </p>

        </div>


        {/* PURCHASES */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          transition
          hover:-translate-y-0.5
          hover:shadow-md
        ">

          <div className="
            flex
            items-start
            justify-between
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-violet-50
              text-violet-600
            ">

              <ShoppingCart size={19} />

            </div>


            <span className="
              rounded-full
              bg-violet-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-violet-600
            ">
              Pending
            </span>

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Pending Purchases
          </p>


          <p className="
            mt-1
            text-3xl
            font-bold
          ">
            {purchaseSummary.pending}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Awaiting confirmation
          </p>

        </div>


        {/* NOTIFICATIONS */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          transition
          hover:-translate-y-0.5
          hover:shadow-md
        ">

          <div className="
            flex
            items-start
            justify-between
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-rose-50
              text-rose-600
            ">

              <Bell size={19} />

            </div>


            <span className="
              rounded-full
              bg-rose-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-rose-600
            ">
              Unread
            </span>

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Notifications
          </p>


          <p className="
            mt-1
            text-3xl
            font-bold
          ">
            {unreadNotifications.length}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Requiring your attention
          </p>

        </div>

      </div>


      {/* =================================================
          OPERATIONS SNAPSHOT
      ================================================= */}

      <div className="
        mt-5
        grid
        grid-cols-1
        gap-5
        xl:grid-cols-3
      ">


        {/* INVENTORY HEALTH */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          xl:col-span-2
        ">

          <div className="
            flex
            items-center
            justify-between
          ">

            <div>

              <h2 className="
                text-sm
                font-semibold
                text-slate-900
              ">
                Inventory Health
              </h2>


              <p className="
                mt-1
                text-xs
                text-slate-500
              ">
                Current stock condition across your inventory.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate("/inventory")
              }
              className="
                inline-flex
                items-center
                gap-1
                text-xs
                font-semibold
                text-blue-600
                hover:text-blue-700
              "
            >
              Inventory
              <ChevronRight size={14} />
            </button>

          </div>


          <div className="
            mt-6
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-4
          ">


            {/* HEALTHY */}

            <div className="
              rounded-xl
              border
              border-emerald-100
              bg-emerald-50/60
              p-4
            ">

              <CheckCircle2
                size={16}
                className="text-emerald-600"
              />


              <p className="
                mt-3
                text-xs
                font-medium
                text-slate-500
              ">
                Healthy
              </p>


              <p className="
                mt-1
                text-xl
                font-bold
              ">
                {inventorySummary.healthy}
              </p>

            </div>


            {/* LOW */}

            <div className="
              rounded-xl
              border
              border-amber-100
              bg-amber-50/60
              p-4
            ">

              <CircleAlert
                size={16}
                className="text-amber-600"
              />


              <p className="
                mt-3
                text-xs
                font-medium
                text-slate-500
              ">
                Low
              </p>


              <p className="
                mt-1
                text-xl
                font-bold
              ">
                {inventorySummary.low}
              </p>

            </div>


            {/* CRITICAL */}

            <div className="
              rounded-xl
              border
              border-orange-100
              bg-orange-50/60
              p-4
            ">

              <AlertTriangle
                size={16}
                className="text-orange-600"
              />


              <p className="
                mt-3
                text-xs
                font-medium
                text-slate-500
              ">
                Critical
              </p>


              <p className="
                mt-1
                text-xl
                font-bold
              ">
                {inventorySummary.critical}
              </p>

            </div>


            {/* OUT */}

            <div className="
              rounded-xl
              border
              border-red-100
              bg-red-50/60
              p-4
            ">

              <XCircle
                size={16}
                className="text-red-600"
              />


              <p className="
                mt-3
                text-xs
                font-medium
                text-slate-500
              ">
                Out of Stock
              </p>


              <p className="
                mt-1
                text-xl
                font-bold
              ">
                {inventorySummary.outOfStock}
              </p>

            </div>

          </div>


          {/* HEALTH BAR */}

          <div className="
            mt-5
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            p-4
          ">

            <div className="
              flex
              items-center
              justify-between
            ">

              <div>

                <p className="
                  text-xs
                  font-semibold
                  text-slate-700
                ">
                  Overall stock health
                </p>


                <p className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                ">
                  {inventorySummary.healthy} of{" "}
                  {inventorySummary.total} ingredients are healthy.
                </p>

              </div>


              <span className="
                text-sm
                font-bold
                text-emerald-600
              ">
                {healthPercentage}%
              </span>

            </div>


            <div className="
              mt-3
              h-2
              overflow-hidden
              rounded-full
              bg-slate-200
            ">

              <div
                className="
                  h-full
                  rounded-full
                  bg-emerald-500
                "
                style={{
                  width:
                    `${healthPercentage}%`,
                }}
              />

            </div>


            <div className="
              mt-3
              flex
              flex-wrap
              gap-x-5
              gap-y-2
            ">

              <div className="
                flex
                items-center
                gap-1.5
              ">

                <span className="
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-500
                "></span>

                <span className="
                  text-[11px]
                  text-slate-500
                ">
                  Healthy
                </span>

              </div>


              <div className="
                flex
                items-center
                gap-1.5
              ">

                <span className="
                  h-2
                  w-2
                  rounded-full
                  bg-amber-400
                "></span>

                <span className="
                  text-[11px]
                  text-slate-500
                ">
                  Low
                </span>

              </div>


              <div className="
                flex
                items-center
                gap-1.5
              ">

                <span className="
                  h-2
                  w-2
                  rounded-full
                  bg-orange-500
                "></span>

                <span className="
                  text-[11px]
                  text-slate-500
                ">
                  Critical
                </span>

              </div>


              <div className="
                flex
                items-center
                gap-1.5
              ">

                <span className="
                  h-2
                  w-2
                  rounded-full
                  bg-red-500
                "></span>

                <span className="
                  text-[11px]
                  text-slate-500
                ">
                  Out of stock
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* INVENTORY TOTALS */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
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
              items-center
              justify-center
              rounded-xl
              bg-blue-50
              text-blue-600
            ">

              <Warehouse size={18} />

            </div>


            <div>

              <h2 className="
                text-sm
                font-semibold
              ">
                Inventory Position
              </h2>


              <p className="
                mt-0.5
                text-[11px]
                text-slate-400
              ">
                Current quantity snapshot
              </p>

            </div>

          </div>


          <div className="
            mt-6
            space-y-4
          ">

            <div className="
              rounded-xl
              bg-blue-50
              p-4
            ">

              <p className="
                text-xs
                text-blue-700
              ">
                Available Quantity
              </p>


              <p className="
                mt-1
                text-2xl
                font-bold
                text-slate-900
              ">
                {formatNumber(
                  inventorySummary.availableQuantity
                )}
              </p>

            </div>


            <div className="
              rounded-xl
              bg-violet-50
              p-4
            ">

              <p className="
                text-xs
                text-violet-700
              ">
                Reserved Quantity
              </p>


              <p className="
                mt-1
                text-2xl
                font-bold
                text-slate-900
              ">
                {formatNumber(
                  inventorySummary.reservedQuantity
                )}
              </p>

            </div>


            <div className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-slate-100
              px-4
              py-3
            ">

              <div className="
                flex
                items-center
                gap-2
              ">

                <Boxes
                  size={15}
                  className="text-slate-400"
                />

                <span className="
                  text-xs
                  text-slate-500
                ">
                  Inventory records
                </span>

              </div>


              <span className="
                text-sm
                font-bold
                text-slate-800
              ">
                {inventorySummary.total}
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          LOW STOCK + PURCHASES
      ================================================= */}

      <div className="
        mt-5
        grid
        grid-cols-1
        gap-5
        xl:grid-cols-2
      ">


        {/* LOW STOCK */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
        ">

          <div className="
            flex
            items-center
            justify-between
          ">

            <div>

              <h2 className="
                text-sm
                font-semibold
              ">
                Stock Requiring Attention
              </h2>


              <p className="
                mt-1
                text-xs
                text-slate-500
              ">
                Ingredients that need to be monitored.
              </p>

            </div>


            <AlertTriangle
              size={18}
              className="text-amber-500"
            />

          </div>


          <div className="
            mt-5
            space-y-3
          ">

            {lowStockItems.length === 0 ? (

              <div className="
                rounded-xl
                border
                border-emerald-100
                bg-emerald-50/60
                px-4
                py-6
                text-center
              ">

                <CheckCircle2
                  size={24}
                  className="
                    mx-auto
                    text-emerald-500
                  "
                />


                <p className="
                  mt-2
                  text-xs
                  font-semibold
                  text-emerald-700
                ">
                  Inventory looks healthy
                </p>


                <p className="
                  mt-1
                  text-[11px]
                  text-emerald-600
                ">
                  No items currently need attention.
                </p>

              </div>

            ) : (

              lowStockItems.map((item) => {

                const available =
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
                          (
                            available /
                            reorder
                          ) * 100
                        )
                      )
                    : 0;


                const status =
                  getStockStatus(item);


                const barColor =
                  status ===
                  "OUT_OF_STOCK"
                    ? "bg-red-500"
                    : status ===
                      "CRITICAL"
                    ? "bg-orange-500"
                    : "bg-amber-400";


                const statusColor =
                  status ===
                  "OUT_OF_STOCK"
                    ? "text-red-600"
                    : status ===
                      "CRITICAL"
                    ? "text-orange-600"
                    : "text-amber-600";


                return (

                  <div
                    key={
                      `${item.id}-${item.location_id}`
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-100
                      p-3.5
                    "
                  >

                    <div className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    ">

                      <div className="
                        min-w-0
                      ">

                        <p className="
                          truncate
                          text-xs
                          font-semibold
                          text-slate-800
                        ">
                          {item.ingredient ||
                            item.name ||
                            "Unknown item"}
                        </p>


                        <p className="
                          mt-0.5
                          truncate
                          text-[11px]
                          text-slate-400
                        ">
                          {formatNumber(
                            available
                          )}{" "}
                          {item.unit || ""}{" "}
                          ·{" "}
                          {item.location ||
                            "Unknown location"}
                        </p>

                      </div>


                      <span className={`
                        shrink-0
                        text-[10px]
                        font-semibold
                        ${statusColor}
                      `}>
                        {
                          status ===
                          "OUT_OF_STOCK"
                            ? "OUT"
                            : `${percentage}%`
                        }
                      </span>

                    </div>


                    <div className="
                      mt-2
                      h-1.5
                      overflow-hidden
                      rounded-full
                      bg-slate-100
                    ">

                      <div
                        className={`
                          h-full
                          rounded-full
                          ${barColor}
                        `}
                        style={{
                          width:
                            `${percentage}%`,
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
            className="
              mt-5
              flex
              w-full
              items-center
              justify-center
              gap-1.5
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              py-2.5
              text-xs
              font-semibold
              text-slate-600
              transition
              hover:bg-slate-100
              hover:text-blue-600
            "
          >

            View inventory

            <ChevronRight size={14} />

          </button>

        </div>


        {/* PURCHASES */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
        ">

          <div className="
            flex
            items-center
            justify-between
          ">

            <div>

              <h2 className="
                text-sm
                font-semibold
              ">
                Purchase Overview
              </h2>


              <p className="
                mt-1
                text-xs
                text-slate-500
              ">
                Current purchase workflow status.
              </p>

            </div>


            <ShoppingCart
              size={18}
              className="text-violet-500"
            />

          </div>


          <div className="
            mt-5
            grid
            grid-cols-3
            gap-3
          ">

            <div className="
              rounded-xl
              bg-amber-50
              p-4
            ">

              <Clock3
                size={16}
                className="text-amber-600"
              />


              <p className="
                mt-3
                text-xs
                text-slate-500
              ">
                Pending
              </p>


              <p className="
                mt-1
                text-xl
                font-bold
              ">
                {purchaseSummary.pending}
              </p>

            </div>


            <div className="
              rounded-xl
              bg-emerald-50
              p-4
            ">

              <CheckCircle2
                size={16}
                className="text-emerald-600"
              />


              <p className="
                mt-3
                text-xs
                text-slate-500
              ">
                Completed
              </p>


              <p className="
                mt-1
                text-xl
                font-bold
              ">
                {purchaseSummary.completed}
              </p>

            </div>


            <div className="
              rounded-xl
              bg-red-50
              p-4
            ">

              <XCircle
                size={16}
                className="text-red-600"
              />


              <p className="
                mt-3
                text-xs
                text-slate-500
              ">
                Cancelled
              </p>


              <p className="
                mt-1
                text-xl
                font-bold
              ">
                {purchaseSummary.cancelled}
              </p>

            </div>

          </div>


          <div className="
            mt-4
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            p-4
          ">

            <div className="
              flex
              items-center
              justify-between
            ">

              <div>

                <p className="
                  text-xs
                  font-semibold
                  text-slate-700
                ">
                  Total purchases
                </p>


                <p className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                ">
                  Purchase records in the system
                </p>

              </div>


              <span className="
                text-xl
                font-bold
                text-slate-900
              ">
                {purchaseSummary.total}
              </span>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/purchases")
            }
            className="
              mt-4
              flex
              w-full
              items-center
              justify-center
              gap-1.5
              rounded-xl
              border
              border-slate-200
              bg-white
              py-2.5
              text-xs
              font-semibold
              text-slate-600
              transition
              hover:bg-slate-50
              hover:text-blue-600
            "
          >

            View purchases

            <ChevronRight size={14} />

          </button>

        </div>

      </div>


      {/* =================================================
          RECENT ACTIVITY + NOTIFICATIONS
      ================================================= */}

      <div className="
        mt-5
        grid
        grid-cols-1
        gap-5
        xl:grid-cols-3
      ">


        {/* RECENT ACTIVITY */}

        <div className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          xl:col-span-2
        ">

          <div className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-5
            py-4
          ">

            <div>

              <div className="
                flex
                items-center
                gap-2
              ">

                <Activity
                  size={16}
                  className="text-blue-600"
                />

                <h2 className="
                  text-sm
                  font-semibold
                ">
                  Recent Activity
                </h2>

              </div>


              <p className="
                mt-1
                text-[11px]
                text-slate-400
              ">
                Latest inventory movements.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate("/inventory")
              }
              className="
                inline-flex
                items-center
                gap-1
                text-xs
                font-semibold
                text-blue-600
                hover:text-blue-700
              "
            >

              View all

              <ChevronRight size={14} />

            </button>

          </div>


          <div className="
            divide-y
            divide-slate-100
          ">

            {recentActivity.length === 0 ? (

              <div className="
                py-12
                text-center
              ">

                <Boxes
                  size={25}
                  className="
                    mx-auto
                    text-slate-300
                  "
                />


                <p className="
                  mt-3
                  text-xs
                  font-semibold
                  text-slate-600
                ">
                  No recent activity
                </p>


                <p className="
                  mt-1
                  text-[11px]
                  text-slate-400
                ">
                  Stock movements will appear here.
                </p>

              </div>

            ) : (

              recentActivity.map(
                (activity) => {

                  const positive =
                    isPositiveMovement(
                      activity.movement_type
                    );


                  const ActivityIcon =
                    getMovementIcon(
                      activity.movement_type
                    );


                  const style =
                    getMovementStyle(
                      activity.movement_type
                    );


                  const quantity =
                    Number(
                      activity.quantity ?? 0
                    );


                  return (

                    <div
                      key={activity.id}
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        px-5
                        py-3.5
                        transition
                        hover:bg-slate-50
                      "
                    >

                      <div className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      ">

                        <div className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          ${style.bg}
                          ${style.text}
                        `}>

                          <ActivityIcon
                            size={17}
                          />

                        </div>


                        <div className="
                          min-w-0
                        ">

                          <p className="
                            truncate
                            text-xs
                            font-semibold
                            text-slate-800
                          ">
                            {activity.ingredient ||
                              "Inventory item"}
                          </p>


                          <p className="
                            mt-0.5
                            truncate
                            text-[11px]
                            text-slate-400
                          ">

                            {String(
                              activity.movement_type ||
                              "MOVEMENT"
                            ).replace(
                              /_/g,
                              " "
                            )}

                            {" · "}

                            {activity.location ||
                              "Inventory"}

                            {activity.created_by_name &&
                              ` · ${activity.created_by_name}`}

                          </p>

                        </div>

                      </div>


                      <div className="
                        shrink-0
                        text-right
                      ">

                        <p className={`
                          text-xs
                          font-semibold
                          ${
                            positive
                              ? "text-emerald-600"
                              : "text-slate-700"
                          }
                        `}>

                          {positive
                            ? "+"
                            : "-"}

                          {formatNumber(
                            Math.abs(
                              quantity
                            )
                          )}

                          {" "}

                          {activity.unit ||
                            ""}

                        </p>


                        <p className="
                          mt-0.5
                          text-[10px]
                          text-slate-400
                        ">
                          {formatRelativeTime(
                            activity.created_at
                          )}
                        </p>

                      </div>

                    </div>

                  );

                }
              )

            )}

          </div>

        </div>


        {/* NOTIFICATIONS */}

        <div className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        ">

          <div className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-5
            py-4
          ">

            <div>

              <div className="
                flex
                items-center
                gap-2
              ">

                <Bell
                  size={16}
                  className="text-rose-500"
                />

                <h2 className="
                  text-sm
                  font-semibold
                ">
                  Notifications
                </h2>

              </div>


              <p className="
                mt-1
                text-[11px]
                text-slate-400
              ">
                Recent alerts and updates.
              </p>

            </div>


            {unreadNotifications.length >
              0 && (

              <span className="
                rounded-full
                bg-rose-50
                px-2
                py-1
                text-[10px]
                font-semibold
                text-rose-600
              ">
                {unreadNotifications.length} unread
              </span>

            )}

          </div>


          <div className="
            divide-y
            divide-slate-100
          ">

            {notifications.length === 0 ? (

              <div className="
                px-5
                py-12
                text-center
              ">

                <Bell
                  size={24}
                  className="
                    mx-auto
                    text-slate-300
                  "
                />


                <p className="
                  mt-3
                  text-xs
                  font-semibold
                  text-slate-600
                ">
                  No notifications
                </p>


                <p className="
                  mt-1
                  text-[11px]
                  text-slate-400
                ">
                  You're all caught up.
                </p>

              </div>

            ) : (

              notifications
                .slice(0, 5)
                .map((notification) => (

                  <div
                    key={notification.id}
                    className="
                      px-5
                      py-3.5
                    "
                  >

                    <div className="
                      flex
                      gap-3
                    ">

                      <div className={`
                        mt-0.5
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        ${
                          notification.is_read
                            ? "bg-slate-100 text-slate-400"
                            : "bg-rose-50 text-rose-500"
                        }
                      `}>

                        <Bell size={13} />

                      </div>


                      <div className="
                        min-w-0
                        flex-1
                      ">

                        <div className="
                          flex
                          items-start
                          justify-between
                          gap-2
                        ">

                          <p className="
                            text-xs
                            font-semibold
                            text-slate-700
                          ">
                            {notification.title ||
                              "Notification"}
                          </p>


                          {!notification.is_read && (

                            <span className="
                              mt-1
                              h-1.5
                              w-1.5
                              shrink-0
                              rounded-full
                              bg-rose-500
                            "></span>

                          )}

                        </div>


                        <p className="
                          mt-1
                          line-clamp-2
                          text-[11px]
                          leading-4
                          text-slate-400
                        ">
                          {notification.message ||
                            "No message available."}
                        </p>


                        <p className="
                          mt-1.5
                          text-[10px]
                          text-slate-300
                        ">
                          {formatDate(
                            notification.created_at
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                ))

            )}

          </div>


          {notifications.length > 0 && (

            <button
              type="button"
              onClick={() =>
                navigate("/notifications")
              }
              className="
                flex
                w-full
                items-center
                justify-center
                gap-1.5
                border-t
                border-slate-100
                py-3
                text-xs
                font-semibold
                text-blue-600
                hover:bg-slate-50
              "
            >

              View notifications

              <ArrowRight size={13} />

            </button>

          )}

        </div>

      </div>


      {/* =================================================
          QUICK ACCESS
      ================================================= */}

      <div className="
        mt-5
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
      ">

        <div className="
          flex
          items-center
          justify-between
        ">

          <div>

            <div className="
              flex
              items-center
              gap-2
            ">

              <ClipboardList
                size={16}
                className="text-blue-600"
              />

              <h2 className="
                text-sm
                font-semibold
              ">
                Quick Access
              </h2>

            </div>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Jump directly to the areas you use most.
            </p>

          </div>

        </div>


        <div className="
          mt-5
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          lg:grid-cols-4
        ">


          {/* INVENTORY */}

          <button
            type="button"
            onClick={() =>
              navigate("/inventory")
            }
            className="
              group
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-slate-200
              p-4
              text-left
              transition
              hover:border-blue-200
              hover:bg-blue-50/50
            "
          >

            <div className="
              flex
              items-center
              gap-3
            ">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
              ">

                <Package size={17} />

              </div>


              <div>

                <p className="
                  text-xs
                  font-semibold
                  text-slate-700
                ">
                  Inventory
                </p>


                <p className="
                  mt-0.5
                  text-[10px]
                  text-slate-400
                ">
                  Manage stock
                </p>

              </div>

            </div>


            <ChevronRight
              size={15}
              className="
                text-slate-300
                transition
                group-hover:text-blue-500
              "
            />

          </button>


          {/* PURCHASES */}

          <button
            type="button"
            onClick={() =>
              navigate("/purchases")
            }
            className="
              group
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-slate-200
              p-4
              text-left
              transition
              hover:border-violet-200
              hover:bg-violet-50/50
            "
          >

            <div className="
              flex
              items-center
              gap-3
            ">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-violet-50
                text-violet-600
              ">

                <ShoppingCart size={17} />

              </div>


              <div>

                <p className="
                  text-xs
                  font-semibold
                  text-slate-700
                ">
                  Purchases
                </p>


                <p className="
                  mt-0.5
                  text-[10px]
                  text-slate-400
                ">
                  Purchase workflow
                </p>

              </div>

            </div>


            <ChevronRight
              size={15}
              className="
                text-slate-300
                transition
                group-hover:text-violet-500
              "
            />

          </button>


          {/* REPORTS */}

          <button
            type="button"
            onClick={() =>
              navigate("/reports")
            }
            className="
              group
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-slate-200
              p-4
              text-left
              transition
              hover:border-emerald-200
              hover:bg-emerald-50/50
            "
          >

            <div className="
              flex
              items-center
              gap-3
            ">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              ">

                <BarChart3 size={17} />

              </div>


              <div>

                <p className="
                  text-xs
                  font-semibold
                  text-slate-700
                ">
                  Reports
                </p>


                <p className="
                  mt-0.5
                  text-[10px]
                  text-slate-400
                ">
                  Analytics & insights
                </p>

              </div>

            </div>


            <ChevronRight
              size={15}
              className="
                text-slate-300
                transition
                group-hover:text-emerald-500
              "
            />

          </button>


          {/* ACTIVITY */}

          <button
            type="button"
            onClick={() =>
              navigate("/inventory")
            }
            className="
              group
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-slate-200
              p-4
              text-left
              transition
              hover:border-amber-200
              hover:bg-amber-50/50
            "
          >

            <div className="
              flex
              items-center
              gap-3
            ">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-amber-50
                text-amber-600
              ">

                <Activity size={17} />

              </div>


              <div>

                <p className="
                  text-xs
                  font-semibold
                  text-slate-700
                ">
                  Stock Activity
                </p>


                <p className="
                  mt-0.5
                  text-[10px]
                  text-slate-400
                ">
                  Movement history
                </p>

              </div>

            </div>


            <ChevronRight
              size={15}
              className="
                text-slate-300
                transition
                group-hover:text-amber-500
              "
            />

          </button>

        </div>

      </div>


      {/* =================================================
          REPORT CTA
      ================================================= */}

      <div className="
        mt-5
        overflow-hidden
        rounded-2xl
        bg-slate-900
        p-6
        shadow-sm
      ">

        <div className="
          flex
          flex-col
          gap-5
          md:flex-row
          md:items-center
          md:justify-between
        ">

          <div>

            <div className="
              flex
              items-center
              gap-2
            ">

              <TrendingUp
                size={18}
                className="text-blue-400"
              />

              <p className="
                text-sm
                font-semibold
                text-white
              ">
                Need deeper inventory insights?
              </p>

            </div>


            <p className="
              mt-1.5
              max-w-xl
              text-xs
              leading-5
              text-slate-400
            ">
              View detailed consumption, wastage,
              purchase and stock activity reports
              with filters and visual analytics.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/reports")
            }
            className="
              inline-flex
              h-10
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-white
              px-4
              text-xs
              font-semibold
              text-slate-900
              transition
              hover:bg-slate-100
            "
          >

            Open Reports

            <ArrowRight size={14} />

          </button>

        </div>

      </div>

    </div>

  );

};


export default Dashboard;