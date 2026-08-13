import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  Package,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";

import api from "../services/api";

import TransferFormModal from "../components/TransferFormModal";
import TransferDetailsModal from "../components/TransferDetailsModal";

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [selectedTransferId, setSelectedTransferId] =
    useState(null);

  // =========================================================
  // CURRENT USER / ROLE
  // =========================================================

  const getCurrentUser = () => {
    try {
      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error(
        "Unable to read current user:",
        error
      );

      return null;
    }
  };

  const user = getCurrentUser();

  const role = String(
    user?.role ||
      user?.roleName ||
      user?.role_name ||
      user?.user?.role ||
      ""
  ).toUpperCase();

  const canCreateTransfer =
    role === "ADMIN" ||
    role === "MANAGER" ||
    role === "STORE_KEEPER";

  // =========================================================
  // LOAD TRANSFERS
  // =========================================================

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
        await api.get("/transfers");

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
          "Unable to load stock transfers."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransfers(true);
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredTransfers =
    transfers.filter((transfer) => {
      const searchTerm =
        search.trim().toLowerCase();

      if (!searchTerm) {
        return true;
      }

      return (
        String(
          transfer.ingredient || ""
        )
          .toLowerCase()
          .includes(searchTerm) ||
        String(
          transfer.from_location || ""
        )
          .toLowerCase()
          .includes(searchTerm) ||
        String(
          transfer.to_location || ""
        )
          .toLowerCase()
          .includes(searchTerm) ||
        String(
          transfer.created_by_name || ""
        )
          .toLowerCase()
          .includes(searchTerm) ||
        String(
          transfer.reason || ""
        )
          .toLowerCase()
          .includes(searchTerm) ||
        String(transfer.id)
          .toLowerCase()
          .includes(searchTerm)
      );
    });

  // =========================================================
  // FORMAT
  // =========================================================

  const formatQuantity = (value) => {
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
  // CREATE SUCCESS
  // =========================================================

  const handleTransferCreated = async () => {
    setShowCreateModal(false);

    await fetchTransfers(false);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-full bg-white">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div
              className="
                mx-auto flex h-12 w-12
                items-center justify-center
                rounded-2xl bg-blue-50
                text-blue-600
              "
            >
              <RefreshCw
                size={20}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading transfers
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Fetching stock movement history...
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
    <div className="min-h-full bg-white text-slate-900">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        className="
          mb-7 flex flex-col gap-5
          sm:flex-row sm:items-center
          sm:justify-between
        "
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Stock Transfers
            </h1>

            {refreshing && (
              <RefreshCw
                size={15}
                className="animate-spin text-blue-500"
              />
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Move ingredients between inventory locations.
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              fetchTransfers(false)
            }
            disabled={refreshing}
            className="
              inline-flex h-10
              items-center gap-2
              rounded-xl border
              border-slate-200
              bg-white px-3.5
              text-sm font-medium
              text-slate-600
              shadow-sm
              transition
              hover:border-slate-300
              hover:bg-slate-50
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

          {/* NEW TRANSFER */}

          {canCreateTransfer && (
            <button
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
              className="
                inline-flex h-10
                items-center gap-2
                rounded-xl
                bg-blue-600
                px-4
                text-sm font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >
              <ArrowDownToLine
                size={16}
              />

              New Transfer
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            mb-6 flex items-start gap-3
            rounded-2xl border
            border-red-100
            bg-red-50
            px-4 py-3.5
          "
        >
          <XCircle
            size={18}
            className="mt-0.5 shrink-0 text-red-500"
          />

          <div>
            <p className="text-sm font-semibold text-red-700">
              Transfer data could not be loaded
            </p>

            <p className="mt-0.5 text-xs text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5 shadow-sm
          "
        >
          <div className="flex items-center justify-between">
            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl bg-blue-50
                text-blue-600
              "
            >
              <ArrowDownToLine
                size={19}
              />
            </div>

            <span
              className="
                rounded-full bg-blue-50
                px-2.5 py-1
                text-[11px] font-semibold
                text-blue-600
              "
            >
              Transfers
            </span>
          </div>

          <p className="mt-5 text-xs font-medium text-slate-500">
            Total Transfers
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {transfers.length}
          </p>
        </div>

        <div
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5 shadow-sm
          "
        >
          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl bg-violet-50
              text-violet-600
            "
          >
            <Package size={19} />
          </div>

          <p className="mt-5 text-xs font-medium text-slate-500">
            Search Results
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {filteredTransfers.length}
          </p>
        </div>

        <div
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5 shadow-sm
          "
        >
          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl bg-emerald-50
              text-emerald-600
            "
          >
            <ArrowRight size={19} />
          </div>

          <p className="mt-5 text-xs font-medium text-slate-500">
            Locations Involved
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {new Set(
              transfers.flatMap(
                (transfer) => [
                  transfer.from_location,
                  transfer.to_location,
                ]
              )
            ).size}
          </p>
        </div>

      </div>

      {/* =====================================================
          TABLE CARD
      ====================================================== */}

      <div
        className="
          mt-5 rounded-2xl
          border border-slate-200
          bg-white shadow-sm
        "
      >

        {/* SEARCH */}

        <div
          className="
            border-b border-slate-100
            p-5
          "
        >
          <div className="relative w-full max-w-md">
            <Search
              size={16}
              className="
                pointer-events-none
                absolute left-3.5 top-1/2
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
                Search ingredient, location,
                user or transfer...
              "
              className="
                h-10 w-full
                rounded-xl
                border border-slate-200
                bg-white
                pl-10 pr-4
                text-sm
                outline-none
                transition
                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>
        </div>

        {/* EMPTY */}

        {filteredTransfers.length === 0 && (
          <div className="p-14 text-center">
            <ArrowDownToLine
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No transfers found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {search
                ? "Try changing your search."
                : canCreateTransfer
                  ? "Create your first stock transfer."
                  : "There are no stock transfers yet."}
            </p>

            {canCreateTransfer &&
              !search && (
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(true)
                  }
                  className="
                    mt-4 inline-flex
                    items-center gap-2
                    rounded-xl
                    bg-blue-600
                    px-4 py-2.5
                    text-xs font-semibold
                    text-white
                    hover:bg-blue-700
                  "
                >
                  <ArrowDownToLine
                    size={14}
                  />

                  New Transfer
                </button>
              )}
          </div>
        )}

        {/* TABLE */}

        {filteredTransfers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">

                  <th
                    className="
                      px-6 py-3.5
                      text-left
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Ingredient
                  </th>

                  <th
                    className="
                      px-6 py-3.5
                      text-left
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    From
                  </th>

                  <th
                    className="
                      px-6 py-3.5
                      text-left
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    To
                  </th>

                  <th
                    className="
                      px-6 py-3.5
                      text-left
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Quantity
                  </th>

                  <th
                    className="
                      px-6 py-3.5
                      text-left
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Transferred By
                  </th>

                  <th
                    className="
                      px-6 py-3.5
                      text-left
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Date
                  </th>

                  <th
                    className="
                      px-6 py-3.5
                      text-right
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>
                {filteredTransfers.map(
                  (transfer) => (
                    <tr
                      key={transfer.id}
                      className="
                        border-b
                        border-slate-50
                        transition-colors
                        last:border-0
                        hover:bg-slate-50/70
                      "
                    >

                      {/* INGREDIENT */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">

                          <div
                            className="
                              flex h-9 w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-blue-50
                              text-sm
                              font-bold
                              text-blue-600
                            "
                          >
                            {String(
                              transfer.ingredient ||
                                "?"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {transfer.ingredient ||
                                "Unknown ingredient"}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Transfer #
                              {transfer.id}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* FROM */}

                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {transfer.from_location ||
                            "—"}
                        </span>
                      </td>

                      {/* TO */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">

                          <ArrowRight
                            size={14}
                            className="text-slate-300"
                          />

                          <span className="text-sm font-medium text-slate-700">
                            {transfer.to_location ||
                              "—"}
                          </span>

                        </div>
                      </td>

                      {/* QUANTITY */}

                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-800">
                          {formatQuantity(
                            transfer.quantity
                          )}
                        </span>

                        <span className="ml-1 text-[11px] text-slate-400">
                          {transfer.unit ||
                            ""}
                        </span>
                      </td>

                      {/* USER */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">

                          <User
                            size={14}
                            className="text-slate-400"
                          />

                          <span className="text-sm text-slate-600">
                            {transfer.created_by_name ||
                              "—"}
                          </span>

                        </div>
                      </td>

                      {/* DATE */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">

                          <CalendarDays
                            size={14}
                            className="text-slate-400"
                          />

                          <span className="text-xs text-slate-500">
                            {formatDate(
                              transfer.created_at
                            )}
                          </span>

                        </div>
                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTransferId(
                              transfer.id
                            )
                          }
                          className="
                            rounded-lg
                            px-3 py-1.5
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
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}

        {filteredTransfers.length > 0 && (
          <div
            className="
              border-t border-slate-100
              px-6 py-3.5
              text-[11px] text-slate-400
            "
          >
            Showing{" "}
            {filteredTransfers.length}{" "}
            of {transfers.length} transfers
          </div>
        )}

      </div>

      {/* =====================================================
          CREATE TRANSFER MODAL
      ====================================================== */}

      <TransferFormModal
        isOpen={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
        onSuccess={
          handleTransferCreated
        }
      />

      {/* =====================================================
          TRANSFER DETAILS MODAL
      ====================================================== */}

      <TransferDetailsModal
        transferId={selectedTransferId}
        isOpen={
          Boolean(
            selectedTransferId
          )
        }
        onClose={() =>
          setSelectedTransferId(null)
        }
      />

    </div>
  );
};

export default Transfers;