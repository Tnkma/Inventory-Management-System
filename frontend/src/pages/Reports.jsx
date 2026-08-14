import { useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Package,
  RefreshCw,
  ShoppingCart,
  Trash2,
  Utensils,
  ArrowUpRight,
  AlertCircle,
  MapPin,
  Warehouse,
  Layers3,
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

const Report = () => {

  const [report, setReport] = useState(null);

  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");


  // =======================================================
  // FILTERS
  // =======================================================

  const [locationFilter, setLocationFilter] =
    useState("ALL");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");


  // =======================================================
  // FETCH REPORT
  // =======================================================

  const fetchReport = async (
    showInitialLoading = true,
    customFilters = null
  ) => {

    try {

      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");


      const filters = customFilters || {
        locationId: locationFilter,
        startDate,
        endDate,
      };


      const params = {};


      if (
        filters.locationId &&
        filters.locationId !== "ALL"
      ) {

        params.locationId =
          filters.locationId;

      }


      if (filters.startDate) {

        params.startDate =
          filters.startDate;

      }


      if (filters.endDate) {

        params.endDate =
          filters.endDate;

      }


      const response =
        await api.get(
          "/reports/overview",
          {
            params,
          }
        );


      setReport(
        response.data?.data || null
      );


    } catch (err) {

      console.error(
        "Failed to load inventory report:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to load inventory report."
      );


    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  // =======================================================
  // FETCH LOCATIONS
  // =======================================================

  const fetchLocations = async () => {

    try {

      const response =
        await api.get(
          "/locations"
        );


      setLocations(
        response.data?.data || []
      );


    } catch (err) {

      console.error(
        "Failed to load locations:",
        err
      );

    }

  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    fetchLocations();

    fetchReport(true);

  }, []);


  // =======================================================
  // FILTERS
  // =======================================================

  const handleApplyFilters = () => {

    fetchReport(false);

  };


  const handleResetFilters = () => {

    setLocationFilter("ALL");
    setStartDate("");
    setEndDate("");


    fetchReport(
      false,
      {
        locationId: "ALL",
        startDate: "",
        endDate: "",
      }
    );

  };


  // =======================================================
  // REPORT DATA
  // =======================================================

  const summary =
    report?.summary || {};


  const inventory =
    report?.inventory || {};


  const topConsumption =
    report?.topConsumption || [];


  const topWastage =
    report?.topWastage || [];


  // =======================================================
  // SUMMARY VALUES
  // =======================================================

  const purchasesQuantity =
    Number(
      summary.purchases_quantity || 0
    );


  const consumptionQuantity =
    Number(
      summary.consumption_quantity || 0
    );


  const wastageQuantity =
    Number(
      summary.wastage_quantity || 0
    );


  const purchaseMovements =
    Number(
      summary.purchase_movements || 0
    );


  const consumptionMovements =
    Number(
      summary.consumption_movements || 0
    );


  const wastageMovements =
    Number(
      summary.wastage_movements || 0
    );


  const transferMovements =
    Number(
      summary.transfer_movements || 0
    );


  const currentStock =
    Number(
      inventory.current_quantity || 0
    );


  const reservedStock =
    Number(
      inventory.reserved_quantity || 0
    );


  // =======================================================
  // ACTIVITY CHART DATA
  // =======================================================

  const activityData = useMemo(() => {

    return [
      {
        label: "Purchases",
        quantity: purchasesQuantity,
        movements: purchaseMovements,
        icon: ShoppingCart,
        bg: "bg-blue-50",
        text: "text-blue-600",
        bar: "bg-blue-500",
      },

      {
        label: "Consumption",
        quantity: consumptionQuantity,
        movements: consumptionMovements,
        icon: Utensils,
        bg: "bg-violet-50",
        text: "text-violet-600",
        bar: "bg-violet-500",
      },

      {
        label: "Wastage",
        quantity: wastageQuantity,
        movements: wastageMovements,
        icon: Trash2,
        bg: "bg-red-50",
        text: "text-red-600",
        bar: "bg-red-500",
      },

      {
        label: "Transfers",
        quantity: transferMovements,
        movements: transferMovements,
        icon: ArrowUpRight,
        bg: "bg-amber-50",
        text: "text-amber-600",
        bar: "bg-amber-500",
      },
    ];

  }, [
    purchasesQuantity,
    consumptionQuantity,
    wastageQuantity,
    purchaseMovements,
    consumptionMovements,
    wastageMovements,
    transferMovements,
  ]);


  const maximumActivity =
    Math.max(
      ...activityData.map(
        (item) => item.quantity
      ),
      1
    );


  // =======================================================
  // TOP CONSUMPTION CHART
  // =======================================================

  const maxConsumption =
    Math.max(
      ...topConsumption.map(
        (item) =>
          Number(item.quantity || 0)
      ),
      1
    );


  // =======================================================
  // TOP WASTAGE CHART
  // =======================================================

  const maxWastage =
    Math.max(
      ...topWastage.map(
        (item) =>
          Number(item.quantity || 0)
      ),
      1
    );


  // =======================================================
  // LOADING
  // =======================================================

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
              bg-violet-50
              text-violet-600
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
              Loading inventory report
            </p>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Preparing inventory activity...
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
        lg:flex-row
        lg:items-center
        lg:justify-between
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
              Inventory Reports
            </h1>


            {refreshing && (

              <RefreshCw
                size={15}
                className="
                  animate-spin
                  text-violet-500
                "
              />

            )}

          </div>


          <p className="
            mt-1
            text-sm
            text-slate-500
          ">
            Monitor purchases, consumption, wastage and stock activity.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            fetchReport(false)
          }
          disabled={refreshing}
          className="
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            text-sm
            font-semibold
            text-slate-600
            shadow-sm
            transition
            hover:bg-slate-50
            hover:text-slate-900
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

          <AlertCircle
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
              Report unavailable
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
          FILTERS
      ================================================= */}

      <div className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
      ">

        <div className="
          mb-4
          flex
          items-center
          gap-2
        ">

          <BarChart3
            size={17}
            className="text-violet-600"
          />

          <h2 className="
            text-sm
            font-semibold
            text-slate-900
          ">
            Report Filters
          </h2>

        </div>


        <div className="
          grid
          grid-cols-1
          gap-4
          md:grid-cols-3
          xl:grid-cols-4
        ">


          {/* LOCATION */}

          <div>

            <label className="
              mb-1.5
              block
              text-[11px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            ">
              Location
            </label>


            <div className="relative">

              <MapPin
                size={14}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />


              <select
                value={locationFilter}
                onChange={(event) =>
                  setLocationFilter(
                    event.target.value
                  )
                }
                className="
                  h-10
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-9
                  pr-8
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-violet-300
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              >

                <option value="ALL">
                  All Locations
                </option>


                {locations.map(
                  (location) => (

                    <option
                      key={location.id}
                      value={location.id}
                    >
                      {location.name}
                    </option>

                  )
                )}

              </select>


              <ChevronDown
                size={14}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

            </div>

          </div>


          {/* START DATE */}

          <div>

            <label className="
              mb-1.5
              block
              text-[11px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            ">
              From
            </label>


            <div className="relative">

              <CalendarDays
                size={14}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />


              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-9
                  pr-3
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-violet-300
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />

            </div>

          </div>


          {/* END DATE */}

          <div>

            <label className="
              mb-1.5
              block
              text-[11px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            ">
              To
            </label>


            <div className="relative">

              <CalendarDays
                size={14}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />


              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-9
                  pr-3
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-violet-300
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />

            </div>

          </div>


          {/* ACTIONS */}

          <div className="
            flex
            items-end
            gap-2
          ">

            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={refreshing}
              className="
                h-10
                flex-1
                rounded-xl
                bg-violet-600
                px-4
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-violet-700
                disabled:opacity-60
              "
            >
              Apply
            </button>


            <button
              type="button"
              onClick={handleResetFilters}
              disabled={refreshing}
              className="
                h-10
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-xs
                font-semibold
                text-slate-500
                hover:bg-slate-50
              "
            >
              Reset
            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="
        mt-5
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-5
      ">


        {/* CURRENT STOCK */}

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
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-emerald-50
            text-emerald-600
          ">

            <Package size={19} />

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Current Stock
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
            text-slate-900
          ">
            {formatNumber(
              currentStock
            )}
          </p>


          <p className="
            mt-1
            text-[11px]
            text-slate-400
          ">
            {formatNumber(
              reservedStock
            )} reserved
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

            <ShoppingCart size={19} />

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Purchases
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
            text-slate-900
          ">
            {formatNumber(
              purchasesQuantity
            )}
          </p>


          <p className="
            mt-1
            text-[11px]
            text-slate-400
          ">
            {purchaseMovements} stock movements
          </p>

        </div>


        {/* CONSUMPTION */}

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
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-violet-50
            text-violet-600
          ">

            <Utensils size={19} />

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Consumption
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
            text-slate-900
          ">
            {formatNumber(
              consumptionQuantity
            )}
          </p>


          <p className="
            mt-1
            text-[11px]
            text-slate-400
          ">
            {consumptionMovements} records
          </p>

        </div>


        {/* WASTAGE */}

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
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-red-50
            text-red-600
          ">

            <Trash2 size={19} />

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Wastage
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
            text-slate-900
          ">
            {formatNumber(
              wastageQuantity
            )}
          </p>


          <p className="
            mt-1
            text-[11px]
            text-slate-400
          ">
            {wastageMovements} records
          </p>

        </div>


        {/* TRANSFERS */}

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
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-amber-50
            text-amber-600
          ">

            <ArrowUpRight size={19} />

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Transfers
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
            text-slate-900
          ">
            {formatNumber(
              transferMovements
            )}
          </p>


          <p className="
            mt-1
            text-[11px]
            text-slate-400
          ">
            Transfer movements
          </p>

        </div>

      </div>


      {/* =================================================
          INVENTORY ACTIVITY CHART
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
          border-b
          border-slate-100
          pb-4
        ">

          <div>

            <div className="
              flex
              items-center
              gap-2
            ">

              <BarChart3
                size={17}
                className="text-violet-600"
              />

              <h2 className="
                text-sm
                font-semibold
                text-slate-900
              ">
                Inventory Activity
              </h2>

            </div>


            <p className="
              mt-0.5
              text-[11px]
              text-slate-400
            ">
              Stock movement quantities for the selected period.
            </p>

          </div>

        </div>


        <div className="
          mt-6
          grid
          grid-cols-1
          gap-6
          md:grid-cols-4
        ">

          {activityData.map(
            (item) => {

              const Icon =
                item.icon;


              const percentage =
                Math.max(
                  4,
                  (
                    item.quantity /
                    maximumActivity
                  ) * 100
                );


              return (

                <div
                  key={item.label}
                  className="min-w-0"
                >

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  ">

                    <div className="
                      flex
                      min-w-0
                      items-center
                      gap-2
                    ">

                      <div className={`
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        ${item.bg}
                        ${item.text}
                      `}>

                        <Icon size={15} />

                      </div>


                      <span className="
                        truncate
                        text-xs
                        font-semibold
                        text-slate-700
                      ">
                        {item.label}
                      </span>

                    </div>


                    <span className="
                      text-sm
                      font-bold
                      text-slate-800
                    ">
                      {formatNumber(
                        item.quantity
                      )}
                    </span>

                  </div>


                  <div className="
                    mt-3
                    h-3
                    overflow-hidden
                    rounded-full
                    bg-slate-100
                  ">

                    <div
                      className={`
                        h-full
                        rounded-full
                        transition-all
                        duration-500
                        ${item.bar}
                      `}
                      style={{
                        width:
                          `${percentage}%`,
                      }}
                    />

                  </div>


                  <p className="
                    mt-2
                    text-[10px]
                    text-slate-400
                  ">
                    {item.movements} movement
                    {item.movements === 1
                      ? ""
                      : "s"}
                  </p>

                </div>

              );

            }
          )}

        </div>

      </div>


      {/* =================================================
          TOP CONSUMPTION + TOP WASTAGE
      ================================================= */}

      <div className="
        mt-5
        grid
        grid-cols-1
        gap-5
        xl:grid-cols-2
      ">


        {/* =================================================
            TOP CONSUMPTION
        ================================================= */}

        <div className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        ">

          <div className="
            border-b
            border-slate-100
            px-5
            py-4
          ">

            <div className="
              flex
              items-center
              gap-2
            ">

              <div className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-violet-50
                text-violet-600
              ">

                <Utensils size={15} />

              </div>


              <div>

                <h2 className="
                  text-sm
                  font-semibold
                  text-slate-900
                ">
                  Top Consumption
                </h2>


                <p className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                ">
                  Ingredients with highest usage.
                </p>

              </div>

            </div>

          </div>


          {topConsumption.length === 0 ? (

            <div className="
              p-10
              text-center
            ">

              <Package
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
                text-slate-500
              ">
                No consumption data
              </p>

            </div>

          ) : (

            <div className="
              divide-y
              divide-slate-100
            ">

              {topConsumption.map(
                (item, index) => {

                  const quantity =
                    Number(
                      item.quantity || 0
                    );


                  const percentage =
                    Math.max(
                      3,
                      (
                        quantity /
                        maxConsumption
                      ) * 100
                    );


                  return (

                    <div
                      key={
                        item.ingredient_id ||
                        index
                      }
                      className="
                        px-5
                        py-4
                      "
                    >

                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <div className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                        ">

                          <div className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-violet-50
                            text-xs
                            font-bold
                            text-violet-600
                          ">
                            {index + 1}
                          </div>


                          <div className="min-w-0">

                            <p className="
                              truncate
                              text-xs
                              font-semibold
                              text-slate-700
                            ">
                              {item.ingredient ||
                                "—"}
                            </p>


                            <p className="
                              mt-0.5
                              text-[10px]
                              text-slate-400
                            ">
                              {item.unit || ""}
                            </p>

                          </div>

                        </div>


                        <div className="
                          shrink-0
                          text-right
                        ">

                          <p className="
                            text-sm
                            font-bold
                            text-slate-800
                          ">
                            {formatNumber(
                              quantity
                            )}
                          </p>

                        </div>

                      </div>


                      <div className="
                        ml-11
                        mt-2
                        h-2
                        overflow-hidden
                        rounded-full
                        bg-slate-100
                      ">

                        <div
                          className="
                            h-full
                            rounded-full
                            bg-violet-500
                            transition-all
                            duration-500
                          "
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>


        {/* =================================================
            TOP WASTAGE
        ================================================= */}

        <div className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        ">

          <div className="
            border-b
            border-slate-100
            px-5
            py-4
          ">

            <div className="
              flex
              items-center
              gap-2
            ">

              <div className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-red-50
                text-red-600
              ">

                <Trash2 size={15} />

              </div>


              <div>

                <h2 className="
                  text-sm
                  font-semibold
                  text-slate-900
                ">
                  Top Wastage
                </h2>


                <p className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                ">
                  Ingredients with highest wastage.
                </p>

              </div>

            </div>

          </div>


          {topWastage.length === 0 ? (

            <div className="
              p-10
              text-center
            ">

              <Trash2
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
                text-slate-500
              ">
                No wastage data
              </p>

            </div>

          ) : (

            <div className="
              divide-y
              divide-slate-100
            ">

              {topWastage.map(
                (item, index) => {

                  const quantity =
                    Number(
                      item.quantity || 0
                    );


                  const percentage =
                    Math.max(
                      3,
                      (
                        quantity /
                        maxWastage
                      ) * 100
                    );


                  return (

                    <div
                      key={
                        item.ingredient_id ||
                        index
                      }
                      className="
                        px-5
                        py-4
                      "
                    >

                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <div className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                        ">

                          <div className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-red-50
                            text-xs
                            font-bold
                            text-red-600
                          ">
                            {index + 1}
                          </div>


                          <div className="min-w-0">

                            <p className="
                              truncate
                              text-xs
                              font-semibold
                              text-slate-700
                            ">
                              {item.ingredient ||
                                "—"}
                            </p>


                            <p className="
                              mt-0.5
                              text-[10px]
                              text-slate-400
                            ">
                              {item.unit || ""}
                            </p>

                          </div>

                        </div>


                        <div className="
                          shrink-0
                          text-right
                        ">

                          <p className="
                            text-sm
                            font-bold
                            text-slate-800
                          ">
                            {formatNumber(
                              quantity
                            )}
                          </p>

                        </div>

                      </div>


                      <div className="
                        ml-11
                        mt-2
                        h-2
                        overflow-hidden
                        rounded-full
                        bg-slate-100
                      ">

                        <div
                          className="
                            h-full
                            rounded-full
                            bg-red-500
                            transition-all
                            duration-500
                          "
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          INVENTORY POSITION
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
          gap-2
        ">

          <div className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            bg-emerald-50
            text-emerald-600
          ">

            <Warehouse size={16} />

          </div>


          <div>

            <h2 className="
              text-sm
              font-semibold
              text-slate-900
            ">
              Inventory Position
            </h2>


            <p className="
              mt-0.5
              text-[11px]
              text-slate-400
            ">
              Current and reserved inventory across active locations.
            </p>

          </div>

        </div>


        <div className="
          mt-5
          grid
          grid-cols-1
          gap-4
          md:grid-cols-2
        ">

          <div className="
            rounded-xl
            bg-slate-50
            p-4
          ">

            <div className="
              flex
              items-center
              justify-between
            ">

              <span className="
                text-xs
                font-medium
                text-slate-500
              ">
                Available Stock
              </span>


              <Layers3
                size={16}
                className="text-emerald-500"
              />

            </div>


            <p className="
              mt-2
              text-2xl
              font-bold
              text-slate-900
            ">
              {formatNumber(
                Math.max(
                  0,
                  currentStock - reservedStock
                )
              )}
            </p>

          </div>


          <div className="
            rounded-xl
            bg-slate-50
            p-4
          ">

            <div className="
              flex
              items-center
              justify-between
            ">

              <span className="
                text-xs
                font-medium
                text-slate-500
              ">
                Reserved Stock
              </span>


              <Package
                size={16}
                className="text-amber-500"
              />

            </div>


            <p className="
              mt-2
              text-2xl
              font-bold
              text-slate-900
            ">
              {formatNumber(
                reservedStock
              )}
            </p>

          </div>

        </div>

      </div>

    </div>

  );

};


export default Report;