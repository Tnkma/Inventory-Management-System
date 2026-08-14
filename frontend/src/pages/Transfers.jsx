import { useEffect, useMemo, useState } from "react";

import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Store,
  User,
  XCircle,
} from "lucide-react";

import api from "../services/api";

import TransferFormModal
  from "../components/TransferFormModal";

import TransferDetailsModal
  from "../components/TransferDetailsModal";


// =========================================================
// HELPERS
// =========================================================

const getCurrentUser = () => {

  try {

    const user =
      localStorage.getItem("user");

    return user
      ? JSON.parse(user)
      : null;

  } catch {

    return null;

  }

};


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
// STATUS
// =========================================================

const getStatusConfig = (
  status
) => {

  switch (
    String(status || "").toUpperCase()
  ) {

    case "REQUESTED":

      return {
        label: "Requested",
        icon: Clock3,
        classes:
          "bg-amber-50 text-amber-700",
      };


    case "APPROVED":

      return {
        label: "Approved",
        icon: ShieldCheck,
        classes:
          "bg-blue-50 text-blue-700",
      };


    case "FULFILLED":

      return {
        label: "Fulfilled",
        icon: CheckCircle2,
        classes:
          "bg-emerald-50 text-emerald-700",
      };


    case "REJECTED":

      return {
        label: "Rejected",
        icon: XCircle,
        classes:
          "bg-red-50 text-red-700",
      };


    default:

      return {
        label:
          status || "Unknown",
        icon: Clock3,
        classes:
          "bg-slate-100 text-slate-600",
      };

  }

};


// =========================================================
// COMPONENT
// =========================================================

const Transfers = () => {

  const [transfers, setTransfers] =
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


  const [formOpen, setFormOpen] =
    useState(false);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [selectedTransfer, setSelectedTransfer] =
    useState(null);


  // =======================================================
  // CURRENT USER
  // =======================================================

  const currentUser =
    getCurrentUser();


  const role = String(
    currentUser?.role ||
    currentUser?.roleName ||
    currentUser?.role_name ||
    currentUser?.user?.role ||
    ""
  ).toUpperCase();


  const canCreateRequest =
    role === "KITCHEN_STAFF";


  // =======================================================
  // FETCH TRANSFERS
  // =======================================================

  const fetchTransfers = async (
    showInitialLoading = true
  ) => {

    try {

      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }


      setError("");


      const response =
        await api.get(
          "/transfers"
        );


      setTransfers(
        response.data?.data || []
      );


    } catch (err) {

      console.error(
        "Failed to load transfers:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to load stock transfer requests."
      );


    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  useEffect(() => {

    fetchTransfers(true);

  }, []);


  // =======================================================
  // FILTER
  // =======================================================

  const filteredTransfers =
    useMemo(() => {

      const searchTerm =
        search
          .trim()
          .toLowerCase();


      return transfers.filter(
        (transfer) => {

          const matchesSearch =
            !searchTerm ||
            transfer.ingredient
              ?.toLowerCase()
              .includes(searchTerm) ||
            transfer.from_location
              ?.toLowerCase()
              .includes(searchTerm) ||
            transfer.to_location
              ?.toLowerCase()
              .includes(searchTerm) ||
            transfer.requested_by_name
              ?.toLowerCase()
              .includes(searchTerm);


          const matchesStatus =
            statusFilter === "ALL" ||
            String(
              transfer.status || ""
            ).toUpperCase() ===
              statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    }, [
      transfers,
      search,
      statusFilter,
    ]);


  // =======================================================
  // SUMMARY
  // =======================================================

  const summary =
    useMemo(() => {

      const requested =
        transfers.filter(
          (transfer) =>
            transfer.status ===
            "REQUESTED"
        ).length;


      const approved =
        transfers.filter(
          (transfer) =>
            transfer.status ===
            "APPROVED"
        ).length;


      const fulfilled =
        transfers.filter(
          (transfer) =>
            transfer.status ===
            "FULFILLED"
        ).length;


      const rejected =
        transfers.filter(
          (transfer) =>
            transfer.status ===
            "REJECTED"
        ).length;


      return {
        total: transfers.length,
        requested,
        approved,
        fulfilled,
        rejected,
      };

    }, [transfers]);


  // =======================================================
  // VIEW
  // =======================================================

  const handleView = (
    transfer
  ) => {

    setSelectedTransfer(
      transfer
    );

    setDetailsOpen(true);

  };


  // =======================================================
  // FORM SUCCESS
  // =======================================================

  const handleFormSuccess =
    async () => {

      setFormOpen(false);

      await fetchTransfers(
        false
      );

    };


  // =======================================================
  // DETAILS UPDATED
  // =======================================================

  const handleDetailsUpdated =
    async (updatedTransfer) => {

      if (
        updatedTransfer?.id
      ) {

        setTransfers(
          (current) =>
            current.map(
              (transfer) =>
                Number(transfer.id) ===
                Number(updatedTransfer.id)
                  ? {
                      ...transfer,
                      ...updatedTransfer,
                    }
                  : transfer
            )
        );

        setSelectedTransfer(
          (current) =>
            current
              ? {
                  ...current,
                  ...updatedTransfer,
                }
              : current
        );

      }


      await fetchTransfers(
        false
      );

    };


  // =======================================================
  // FILTER CLEAR
  // =======================================================

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL";


  const clearFilters = () => {

    setSearch("");

    setStatusFilter(
      "ALL"
    );

  };


  // =======================================================
  // SUMMARY CARDS
  // =======================================================

  const summaryCards = [

    {
      key: "total",
      label: "Total Requests",
      value: summary.total,
      caption:
        "All stock requests",
      icon: Send,
      color: "violet",
    },

    {
      key: "requested",
      label: "Pending Approval",
      value: summary.requested,
      caption:
        "Waiting for manager or admin",
      icon: Clock3,
      color: "amber",
    },

    {
      key: "approved",
      label: "Approved",
      value: summary.approved,
      caption:
        "Waiting for store keeper",
      icon: ShieldCheck,
      color: "blue",
    },

    {
      key: "fulfilled",
      label: "Fulfilled",
      value: summary.fulfilled,
      caption:
        "Completed stock transfers",
      icon: CheckCircle2,
      color: "emerald",
    },

  ];


  const colorClasses = {

    violet: {
      bg: "bg-violet-50",
      text: "text-violet-600",
    },

    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
    },

    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
    },

    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },

  };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div
        className="
          min-h-full
          bg-white
        "
      >

        <div
          className="
            flex
            min-h-[500px]
            items-center
            justify-center
          "
        >

          <div className="text-center">

            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-violet-50
                text-violet-600
              "
            >

              <RefreshCw
                size={20}
                className="animate-spin"
              />

            </div>


            <p
              className="
                mt-4
                text-sm
                font-semibold
                text-slate-700
              "
            >
              Loading transfer requests
            </p>


            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              Fetching stock request history...
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

    <div
      className="
        min-h-full
        bg-white
        text-slate-900
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          mb-7
          flex
          flex-col
          gap-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-slate-900
              "
            >
              Stock Transfers
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


          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            Manage stock requests from the main store to kitchen locations.
          </p>

        </div>


        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <button
            type="button"
            onClick={() =>
              fetchTransfers(false)
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


          {canCreateRequest && (

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
                bg-violet-600
                px-4
                text-sm
                font-semibold
                text-white
                shadow-sm
                hover:bg-violet-700
              "
            >

              <Plus size={16} />

              Request Stock

            </button>

          )}

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div
          className="
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
          "
        >

          <XCircle
            size={18}
            className="
              mt-0.5
              shrink-0
              text-red-500
            "
          />


          <div>

            <p
              className="
                text-sm
                font-semibold
                text-red-700
              "
            >
              Transfer operation failed
            </p>


            <p
              className="
                mt-0.5
                text-xs
                text-red-600
              "
            >
              {error}
            </p>

          </div>

        </div>

      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

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
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
              "
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >

                <div
                  className={`
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    ${colorClasses[color].bg}
                    ${colorClasses[color].text}
                  `}
                >

                  <Icon size={19} />

                </div>


                <span
                  className={`
                    rounded-full
                    px-2.5
                    py-1
                    text-[11px]
                    font-semibold
                    ${colorClasses[color].bg}
                    ${colorClasses[color].text}
                  `}
                >
                  {label}
                </span>

              </div>


              <p
                className="
                  mt-5
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                {label}
              </p>


              <p
                className="
                  mt-1
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                {value}
              </p>


              <p
                className="
                  mt-1.5
                  text-xs
                  text-slate-400
                "
              >
                {caption}
              </p>

            </div>

          )
        )}

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      <div
        className="
          mt-5
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >

        {/* FILTER BAR */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-slate-100
            p-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          <div
            className="
              relative
              w-full
              lg:max-w-md
            "
          >

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
              placeholder="Search transfers..."
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
                focus:border-violet-300
                focus:ring-4
                focus:ring-violet-500/10
              "
            />

          </div>


          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="
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
                focus:border-violet-300
                focus:ring-4
                focus:ring-violet-500/10
              "
            >

              <option value="ALL">
                All statuses
              </option>

              <option value="REQUESTED">
                Requested
              </option>

              <option value="APPROVED">
                Approved
              </option>

              <option value="FULFILLED">
                Fulfilled
              </option>

              <option value="REJECTED">
                Rejected
              </option>

            </select>


            {hasActiveFilters && (

              <button
                type="button"
                onClick={clearFilters}
                className="
                  h-10
                  rounded-lg
                  px-3
                  text-xs
                  font-semibold
                  text-violet-600
                  hover:bg-violet-50
                "
              >
                Clear filters
              </button>

            )}

          </div>

        </div>


        {/* EMPTY */}

        {filteredTransfers.length === 0 && (

          <div
            className="
              p-14
              text-center
            "
          >

            <Send
              size={28}
              className="
                mx-auto
                text-slate-300
              "
            />


            <p
              className="
                mt-4
                text-sm
                font-semibold
                text-slate-700
              "
            >
              No transfer requests found
            </p>


            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              {hasActiveFilters
                ? "Try changing your search or filters."
                : canCreateRequest
                  ? "Create your first stock request."
                  : "Stock requests will appear here."}
            </p>


            {!hasActiveFilters &&
              canCreateRequest && (

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
                    bg-violet-50
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-violet-600
                    hover:bg-violet-100
                  "
                >

                  <Plus size={14} />

                  Request Stock

                </button>

              )}

          </div>

        )}


        {/* TABLE */}

        {filteredTransfers.length > 0 && (

          <div
            className="
              overflow-x-auto
            "
          >

            <table className="w-full">

              <thead>

                <tr
                  className="
                    border-b
                    border-slate-100
                    bg-slate-50/60
                  "
                >

                  <th className="
                    px-5 py-3.5
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
                    px-5 py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Route
                  </th>


                  <th className="
                    px-5 py-3.5
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
                    px-5 py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Requested By
                  </th>


                  <th className="
                    px-5 py-3.5
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
                    px-5 py-3.5
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
                    px-5 py-3.5
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

                {filteredTransfers.map(
                  (transfer) => {

                    const status =
                      String(
                        transfer.status || ""
                      ).toUpperCase();


                    const statusConfig =
                      getStatusConfig(
                        status
                      );


                    const StatusIcon =
                      statusConfig.icon;


                    return (

                      <tr
                        key={transfer.id}
                        className="
                          border-b
                          border-slate-50
                          last:border-0
                          hover:bg-slate-50/70
                        "
                      >

                        {/* INGREDIENT */}

                        <td
                          className="
                            px-5 py-4
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >

                            <div
                              className="
                                flex
                                h-9 w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-violet-50
                                text-violet-600
                              "
                            >

                              <Package size={16} />

                            </div>


                            <div>

                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-slate-800
                                "
                              >
                                {transfer.ingredient}
                              </p>


                              <p
                                className="
                                  mt-0.5
                                  text-[11px]
                                  text-slate-400
                                "
                              >
                                {transfer.unit ||
                                  "Unit"}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* ROUTE */}

                        <td
                          className="
                            min-w-[230px]
                            px-5 py-4
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >

                            <span
                              className="
                                text-xs
                                font-semibold
                                text-slate-600
                              "
                            >
                              {transfer.from_location}
                            </span>


                            <ArrowRight
                              size={13}
                              className="
                                shrink-0
                                text-slate-300
                              "
                            />


                            <span
                              className="
                                text-xs
                                font-semibold
                                text-slate-700
                              "
                            >
                              {transfer.to_location}
                            </span>

                          </div>

                        </td>


                        {/* QUANTITY */}

                        <td
                          className="
                            whitespace-nowrap
                            px-5 py-4
                            text-right
                          "
                        >

                          <span
                            className="
                              text-sm
                              font-semibold
                              text-slate-800
                            "
                          >
                            {formatNumber(
                              transfer.quantity
                            )}
                          </span>


                          <span
                            className="
                              ml-1
                              text-[10px]
                              text-slate-400
                            "
                          >
                            {transfer.unit}
                          </span>

                        </td>


                        {/* REQUESTED BY */}

                        <td
                          className="
                            whitespace-nowrap
                            px-5 py-4
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >

                            <div
                              className="
                                flex
                                h-7 w-7
                                items-center
                                justify-center
                                rounded-lg
                                bg-slate-100
                                text-slate-500
                              "
                            >

                              <User size={13} />

                            </div>


                            <div>

                              <p
                                className="
                                  text-xs
                                  font-semibold
                                  text-slate-600
                                "
                              >
                                {transfer.requested_by_name ||
                                  "—"}
                              </p>


                              <p
                                className="
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                {formatDate(
                                  transfer.requested_at
                                )}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* STATUS */}

                        <td
                          className="
                            px-5 py-4
                          "
                        >

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              px-2.5
                              py-1
                              text-[10px]
                              font-semibold
                              ${statusConfig.classes}
                            `}
                          >

                            <StatusIcon
                              size={12}
                            />

                            {statusConfig.label}

                          </span>

                        </td>


                        {/* DATE */}

                        <td
                          className="
                            whitespace-nowrap
                            px-5 py-4
                          "
                        >

                          <span
                            className="
                              text-xs
                              text-slate-500
                            "
                          >
                            {formatDate(
                              transfer.requested_at ||
                              transfer.created_at
                            )}
                          </span>

                        </td>


                        {/* ACTION */}

                        <td
                          className="
                            px-5 py-4
                            text-right
                          "
                        >

                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                transfer
                              )
                            }
                            className="
                              rounded-lg
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              text-violet-600
                              hover:bg-violet-50
                            "
                          >
                            View Details
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


        {/* FOOTER */}

        {filteredTransfers.length > 0 && (

          <div
            className="
              border-t
              border-slate-100
              px-6 py-3.5
              text-[11px]
              text-slate-400
            "
          >

            Showing{" "}
            {filteredTransfers.length}{" "}
            of{" "}
            {transfers.length}{" "}
            transfer requests

          </div>

        )}

      </div>


      {/* =================================================
          REQUEST MODAL
      ================================================= */}

      <TransferFormModal
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

      <TransferDetailsModal
        transfer={selectedTransfer}
        isOpen={detailsOpen}
        onClose={() => {

          setDetailsOpen(false);
          setSelectedTransfer(null);

        }}
        onUpdated={
          handleDetailsUpdated
        }
      />

    </div>

  );

};


export default Transfers;