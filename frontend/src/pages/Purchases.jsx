import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  ShoppingCart,
  ChevronRight,
  XCircle,
  CheckCircle2,
  Clock3,
  Package,
} from "lucide-react";

import api from "../services/api";

import PurchaseForm from "../components/PurchaseForm";
import PurchaseDetails from "../components/PurchaseDetails";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);

  // =========================================================
  // LOAD PURCHASES
  // =========================================================

  const loadPurchases = async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get("/purchases");

      setPurchases(
        response.data?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load purchases:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load purchases."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadPurchases(true);
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return amount.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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

  const getStatusStyle = (status) => {
    const value =
      String(status || "").toUpperCase();

    if (value === "COMPLETED") {
      return {
        className:
          "bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
        label: "Completed",
      };
    }

    if (value === "CANCELLED") {
      return {
        className:
          "bg-red-50 text-red-700",
        icon: XCircle,
        label: "Cancelled",
      };
    }

    return {
      className:
        "bg-amber-50 text-amber-700",
      icon: Clock3,
      label: "Pending",
    };
  };

  // =========================================================
  // FORM SUCCESS
  // =========================================================

  const handlePurchaseCreated = async () => {
    setShowForm(false);

    await loadPurchases(false);
  };

  // =========================================================
  // DETAILS SUCCESS
  // =========================================================

  const handlePurchaseUpdated = async () => {
    await loadPurchases(false);
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
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-blue-50
                text-blue-600
              "
            >
              <RefreshCw
                size={20}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading purchases
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Fetching purchase records...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <div className="min-h-full bg-white text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          mb-7
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Purchases
            </h1>

            {refreshing && (
              <RefreshCw
                size={15}
                className="animate-spin text-blue-500"
              />
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Manage supplier purchases and stock receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() => loadPurchases(false)}
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

          <button
            type="button"
            onClick={() =>
              setShowForm(true)
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
            "
          >
            <Plus size={17} />

            New Stock Receipt
          </button>

        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

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
            className="mt-0.5 shrink-0 text-red-500"
          />

          <div>
            <p className="text-sm font-semibold text-red-700">
              Unable to load purchases
            </p>

            <p className="mt-0.5 text-xs text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
              "
            >
              <ShoppingCart size={19} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Total Purchases
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {purchases.length}
              </p>
            </div>

          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-amber-50
                text-amber-600
              "
            >
              <Clock3 size={19} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Pending
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {
                  purchases.filter(
                    (purchase) =>
                      String(
                        purchase.status || ""
                      ).toUpperCase() ===
                      "PENDING"
                  ).length
                }
              </p>
            </div>

          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              "
            >
              <Package size={19} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Completed
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {
                  purchases.filter(
                    (purchase) =>
                      String(
                        purchase.status || ""
                      ).toUpperCase() ===
                      "COMPLETED"
                  ).length
                }
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* =====================================================
          PURCHASE LIST
      ===================================================== */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >

        <div
          className="
            border-b
            border-slate-100
            px-5
            py-4
          "
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Stock Receipts
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Supplier deliveries and purchase records.
          </p>
        </div>

        {purchases.length === 0 ? (

          <div className="px-6 py-16 text-center">

            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-slate-50
                text-slate-400
              "
            >
              <ShoppingCart size={21} />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No purchases yet
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Create your first stock receipt to get started.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowForm(true)
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-blue-600
                px-4
                py-2.5
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-blue-700
              "
            >
              <Plus size={15} />
              New Stock Receipt
            </button>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {purchases.map((purchase) => {

              const status =
                getStatusStyle(
                  purchase.status
                );

              const StatusIcon =
                status.icon;

              return (
                <button
                  type="button"
                  key={purchase.id}
                  onClick={() =>
                    setSelectedPurchaseId(
                      purchase.id
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    gap-5
                    px-5
                    py-4
                    text-left
                    transition
                    hover:bg-slate-50
                  "
                >

                  <div className="flex min-w-0 items-center gap-4">

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-blue-50
                        text-blue-600
                      "
                    >
                      <ShoppingCart size={18} />
                    </div>

                    <div className="min-w-0">

                      <div className="flex items-center gap-2">

                        <p className="text-sm font-semibold text-slate-800">
                          Purchase #{purchase.id}
                        </p>

                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-1
                            rounded-full
                            px-2
                            py-0.5
                            text-[10px]
                            font-semibold
                            ${status.className}
                          `}
                        >
                          <StatusIcon size={11} />
                          {status.label}
                        </span>

                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {purchase.supplier ||
                          "Unknown supplier"}
                        {" · "}
                        {purchase.receiving_location ||
                          "Receiving location not set"}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {purchase.created_by ||
                          "Unknown user"}
                        {" · "}
                        {formatDate(
                          purchase.purchase_date ||
                          purchase.created_at
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="flex shrink-0 items-center gap-5">

                    <div className="hidden text-right sm:block">

                      <p className="text-xs text-slate-400">
                        Total
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-slate-800">
                        {formatCurrency(
                          purchase.total_amount
                        )}
                      </p>

                    </div>

                    <ChevronRight
                      size={17}
                      className="text-slate-300"
                    />

                  </div>

                </button>
              );
            })}

          </div>

        )}

      </div>

      {/* =====================================================
          CREATE PURCHASE
      ===================================================== */}

      <PurchaseForm
        isOpen={showForm}
        onClose={() =>
          setShowForm(false)
        }
        onSuccess={
          handlePurchaseCreated
        }
      />

      {/* =====================================================
          DETAILS
      ===================================================== */}

      <PurchaseDetails
        purchaseId={
          selectedPurchaseId
        }
        isOpen={
          selectedPurchaseId !== null
        }
        onClose={() =>
          setSelectedPurchaseId(null)
        }
        onUpdated={
          handlePurchaseUpdated
        }
      />

    </div>
  );
};

export default Purchases;