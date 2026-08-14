import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  Eye,
  PackageMinus,
  Plus,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";

import api from "../services/api";

import ConsumptionFormModal
  from "../components/ConsumptionFormModal";

import ConsumptionDetailsModal
  from "../components/ConsumptionDetailsModal";


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


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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


const formatDateTime = (value) => {

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
// COMPONENT
// =========================================================

const Consumption = () => {

  const [consumptions, setConsumptions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");


  const [formOpen, setFormOpen] =
    useState(false);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [selectedConsumption, setSelectedConsumption] =
    useState(null);


  // =======================================================
  // FETCH
  // =======================================================

  const fetchConsumptions = async (
    initial = false
  ) => {

    try {

      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }


      setError("");


      const response =
        await api.get(
          "/consumption"
        );


      setConsumptions(
        response.data?.data || []
      );

    } catch (err) {

      console.error(
        "Failed to load consumption:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to load consumption records."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  useEffect(() => {

    fetchConsumptions(true);

  }, []);


  // =======================================================
  // FILTER
  // =======================================================

  const filteredConsumptions =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase();


      if (!term) {
        return consumptions;
      }


      return consumptions.filter(
        (consumption) =>
          consumption.ingredient
            ?.toLowerCase()
            .includes(term) ||

          consumption.location
            ?.toLowerCase()
            .includes(term) ||

          consumption.created_by_name
            ?.toLowerCase()
            .includes(term) ||

          consumption.reason
            ?.toLowerCase()
            .includes(term)
      );

    }, [
      consumptions,
      search,
    ]);


  // =======================================================
  // SUMMARY
  // =======================================================

  const totalConsumption =
    useMemo(() => {

      return consumptions.reduce(
        (total, consumption) =>
          total +
          Number(
            consumption.quantity || 0
          ),
        0
      );

    }, [consumptions]);


  // =======================================================
  // VIEW DETAILS
  // =======================================================

  const handleView = async (
    consumption
  ) => {

    try {

      setError("");


      const response =
        await api.get(
          `/consumption/${consumption.id}`
        );


      setSelectedConsumption(
        response.data?.data ||
        consumption
      );

      setDetailsOpen(true);

    } catch (err) {

      console.error(
        "Failed to load consumption details:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to load consumption details."
      );

    }

  };


  // =======================================================
  // FORM SUCCESS
  // =======================================================

  const handleFormSuccess =
    async () => {

      setFormOpen(false);

      await fetchConsumptions(false);

    };


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
              bg-amber-50
              text-amber-600
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
              Loading consumption
            </p>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Fetching consumption history...
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
              Consumption
            </h1>


            {refreshing && (

              <RefreshCw
                size={15}
                className="
                  animate-spin
                  text-amber-500
                "
              />

            )}

          </div>


          <p className="
            mt-1
            text-sm
            text-slate-500
          ">
            Record and monitor ingredients consumed from inventory.
          </p>

        </div>


        <div className="
          flex
          items-center
          gap-2
        ">

          <button
            type="button"
            onClick={() =>
              fetchConsumptions(false)
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


          <button
            type="button"
            onClick={() =>
              setFormOpen(true)
            }
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-xl
              bg-amber-600
              px-4
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-amber-700
            "
          >

            <Plus size={16} />

            Record Consumption

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
              Consumption operation failed
            </p>


            <p className="
              mt-0.5
              text-xs
              text-red-600
            ">
              {error}
            </p>

          </div>


          <button
            type="button"
            onClick={() => setError("")}
            className="
              ml-auto
              text-red-400
              hover:text-red-600
            "
          >

            <XCircle size={16} />

          </button>

        </div>

      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-3
      ">

        {/* TOTAL RECORDS */}

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

              <PackageMinus size={19} />

            </div>


            <span className="
              rounded-full
              bg-amber-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-amber-700
            ">
              Consumption
            </span>

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Total Records
          </p>


          <p className="
            mt-1
            text-3xl
            font-bold
            text-slate-900
          ">
            {consumptions.length}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Recorded inventory consumption
          </p>

        </div>


        {/* TOTAL QUANTITY */}

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

            <PackageMinus size={19} />

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Total Quantity
          </p>


          <p className="
            mt-1
            text-3xl
            font-bold
            text-slate-900
          ">
            {formatNumber(totalConsumption)}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Across all recorded consumption
          </p>

        </div>


        {/* LATEST */}

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
            bg-slate-100
            text-slate-600
          ">

            <CalendarDays size={19} />

          </div>


          <p className="
            mt-5
            text-xs
            font-medium
            text-slate-500
          ">
            Latest Consumption
          </p>


          <p className="
            mt-1
            text-sm
            font-bold
            text-slate-900
          ">

            {consumptions.length > 0
              ? formatDateTime(
                  consumptions[0].created_at
                )
              : "—"}

          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Most recent record
          </p>

        </div>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      <div className="
        mt-5
        overflow-hidden
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
          lg:flex-row
          lg:items-center
          lg:justify-between
        ">

          <div className="
            relative
            w-full
            lg:max-w-md
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
              placeholder="Search consumption..."
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
                focus:border-amber-300
                focus:ring-4
                focus:ring-amber-500/10
              "
            />

          </div>


          <p className="
            text-xs
            text-slate-400
          ">
            Showing{" "}
            <span className="
              font-semibold
              text-slate-600
            ">
              {filteredConsumptions.length}
            </span>{" "}
            of{" "}
            <span className="
              font-semibold
              text-slate-600
            ">
              {consumptions.length}
            </span>{" "}
            records
          </p>

        </div>


        {/* EMPTY */}

        {filteredConsumptions.length === 0 && (

          <div className="
            p-14
            text-center
          ">

            <PackageMinus
              size={30}
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

              {search
                ? "No consumption records found"
                : "No consumption recorded yet"}

            </p>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">

              {search
                ? "Try changing your search."
                : "Record your first ingredient consumption."}

            </p>


            {!search && (

              <button
                type="button"
                onClick={() =>
                  setFormOpen(true)
                }
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-amber-50
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-amber-700
                  hover:bg-amber-100
                "
              >

                <Plus size={14} />

                Record Consumption

              </button>

            )}

          </div>

        )}


        {/* TABLE */}

        {filteredConsumptions.length > 0 && (

          <div className="
            overflow-x-auto
          ">

            <table className="w-full">

              <thead>

                <tr className="
                  border-b
                  border-slate-100
                  bg-slate-50/60
                ">

                  <th className="
                    px-5
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
                    px-5
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
                    px-5
                    py-3.5
                    text-right
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Quantity
                  </th>


                  <th className="
                    px-5
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Recorded By
                  </th>


                  <th className="
                    px-5
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Date
                  </th>


                  <th className="
                    px-5
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

                {filteredConsumptions.map(
                  (consumption) => (

                    <tr
                      key={consumption.id}
                      className="
                        border-b
                        border-slate-50
                        last:border-0
                        hover:bg-slate-50/70
                      "
                    >

                      {/* INGREDIENT */}

                      <td className="
                        px-5
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
                            bg-amber-50
                            text-amber-600
                          ">

                            <PackageMinus size={16} />

                          </div>


                          <div>

                            <p className="
                              text-sm
                              font-semibold
                              text-slate-800
                            ">
                              {consumption.ingredient}
                            </p>


                            <p className="
                              mt-0.5
                              text-[11px]
                              text-slate-400
                            ">
                              {consumption.sku ||
                                consumption.unit ||
                                "Ingredient"}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* LOCATION */}

                      <td className="
                        px-5
                        py-4
                      ">

                        <span className="
                          text-xs
                          font-semibold
                          text-slate-600
                        ">
                          {consumption.location ||
                            "—"}
                        </span>

                      </td>


                      {/* QUANTITY */}

                      <td className="
                        whitespace-nowrap
                        px-5
                        py-4
                        text-right
                      ">

                        <span className="
                          text-sm
                          font-semibold
                          text-slate-800
                        ">
                          {formatNumber(
                            consumption.quantity
                          )}
                        </span>


                        <span className="
                          ml-1
                          text-[10px]
                          text-slate-400
                        ">
                          {consumption.unit}
                        </span>

                      </td>


                      {/* USER */}

                      <td className="
                        whitespace-nowrap
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
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-lg
                            bg-slate-100
                            text-slate-500
                          ">

                            <User size={13} />

                          </div>


                          <span className="
                            text-xs
                            font-semibold
                            text-slate-600
                          ">
                            {consumption.created_by_name ||
                              "—"}
                          </span>

                        </div>

                      </td>


                      {/* DATE */}

                      <td className="
                        whitespace-nowrap
                        px-5
                        py-4
                      ">

                        <span className="
                          text-xs
                          text-slate-500
                        ">
                          {formatDate(
                            consumption.created_at
                          )}
                        </span>

                      </td>


                      {/* ACTION */}

                      <td className="
                        px-5
                        py-4
                        text-right
                      ">

                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              consumption
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-lg
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-amber-700
                            transition
                            hover:bg-amber-50
                          "
                        >

                          <Eye size={14} />

                          View Details

                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =================================================
          FORM MODAL
      ================================================= */}

      <ConsumptionFormModal
        isOpen={formOpen}
        onClose={() =>
          setFormOpen(false)
        }
        onSuccess={
          handleFormSuccess
        }
      />


      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      <ConsumptionDetailsModal
        isOpen={detailsOpen}
        consumption={
          selectedConsumption
        }
        onClose={() => {

          setDetailsOpen(false);

          setSelectedConsumption(null);

        }}
      />

    </div>

  );

};


export default Consumption;