import { useEffect, useState } from "react";
import {
  X,
  ArrowRight,
  RefreshCw,
  Package,
  User,
  CalendarDays,
  FileText,
  AlertCircle,
  ArrowDownToLine,
} from "lucide-react";

import api from "../services/api";

const TransferDetailsModal = ({
  transferId,
  isOpen,
  onClose,
}) => {
  const [transfer, setTransfer] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================================================
  // LOAD TRANSFER
  // =========================================================

  const loadTransfer = async () => {
    if (!transferId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/transfers/${transferId}`
      );

      setTransfer(
        response.data?.data || null
      );
    } catch (err) {
      console.error(
        "Failed to load transfer:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load transfer details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !transferId) return;

    loadTransfer();
  }, [isOpen, transferId]);

  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {
    setTransfer(null);
    setError("");
    onClose();
  };

  // =========================================================
  // FORMAT
  // =========================================================

  const formatDate = (value) => {
    if (!value) return "—";

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

  const formatQuantity = (value) => {
    return Number(value || 0).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 3,
      }
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[70]
        flex items-center justify-center
        bg-slate-900/30
        p-4
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="
          flex max-h-[90vh]
          w-full max-w-2xl
          flex-col overflow-hidden
          rounded-2xl border border-slate-200
          bg-white shadow-2xl
        "
      >
        {/* HEADER */}

        <div
          className="
            flex shrink-0
            items-center justify-between
            border-b border-slate-100
            px-6 py-5
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl bg-blue-50
                text-blue-600
              "
            >
              <ArrowDownToLine size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Transfer #{transferId}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Stock transfer details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-lg text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}

        <div className="overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-center">
                <RefreshCw
                  size={23}
                  className="
                    mx-auto animate-spin
                    text-blue-600
                  "
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Loading transfer...
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Fetching transfer details.
                </p>
              </div>
            </div>
          ) : error ? (
            <div
              className="
                rounded-xl border border-red-100
                bg-red-50 px-4 py-4
                text-sm text-red-700
              "
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            </div>
          ) : transfer ? (
            <>
              {/* INGREDIENT */}

              <div
                className="
                  rounded-2xl
                  border border-slate-200
                  bg-slate-50/70
                  p-5
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-11 w-11
                      items-center justify-center
                      rounded-xl bg-blue-50
                      text-blue-600
                    "
                  >
                    <Package size={20} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Ingredient
                    </p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      {transfer.ingredient ||
                        "Unknown ingredient"}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Quantity transferred:{" "}
                      <span className="font-semibold text-slate-600">
                        {formatQuantity(
                          transfer.quantity
                        )}{" "}
                        {transfer.unit || ""}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* TRANSFER FLOW */}

              <div className="mt-5">
                <p className="mb-3 text-xs font-semibold text-slate-700">
                  Transfer Movement
                </p>

                <div
                  className="
                    grid grid-cols-1
                    items-center gap-3
                    sm:grid-cols-[1fr_auto_1fr]
                  "
                >
                  {/* SOURCE */}

                  <div
                    className="
                      rounded-xl
                      border border-slate-200
                      bg-white p-4
                    "
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      From
                    </p>

                    <p className="mt-1.5 text-sm font-bold text-slate-800">
                      {transfer.from_location ||
                        "—"}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Stock after transfer
                    </p>

                    <p className="mt-0.5 text-lg font-bold text-slate-900">
                      {formatQuantity(
                        transfer.source_new_quantity
                      )}{" "}
                      <span className="text-xs font-medium text-slate-400">
                        {transfer.unit || ""}
                      </span>
                    </p>
                  </div>

                  {/* ARROW */}

                  <div className="flex justify-center">
                    <div
                      className="
                        flex h-10 w-10
                        items-center justify-center
                        rounded-full
                        bg-blue-50
                        text-blue-600
                      "
                    >
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  {/* DESTINATION */}

                  <div
                    className="
                      rounded-xl
                      border border-emerald-100
                      bg-emerald-50/50
                      p-4
                    "
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                      To
                    </p>

                    <p className="mt-1.5 text-sm font-bold text-slate-800">
                      {transfer.to_location ||
                        "—"}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Stock after transfer
                    </p>

                    <p className="mt-0.5 text-lg font-bold text-slate-900">
                      {formatQuantity(
                        transfer.destination_new_quantity
                      )}{" "}
                      <span className="text-xs font-medium text-slate-400">
                        {transfer.unit || ""}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* MOVEMENT SUMMARY */}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Source Before
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatQuantity(
                      transfer.source_previous_quantity
                    )}{" "}
                    <span className="text-xs font-medium text-slate-400">
                      {transfer.unit || ""}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-red-500">
                    −{" "}
                    {formatQuantity(
                      transfer.quantity
                    )}{" "}
                    transferred
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                    Destination Before
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatQuantity(
                      transfer.destination_previous_quantity
                    )}{" "}
                    <span className="text-xs font-medium text-slate-400">
                      {transfer.unit || ""}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-emerald-600">
                    +{" "}
                    {formatQuantity(
                      transfer.quantity
                    )}{" "}
                    received
                  </p>
                </div>
              </div>

              {/* DETAILS */}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <User
                      size={15}
                      className="text-slate-400"
                    />

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Transferred By
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {transfer.created_by_name ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      size={15}
                      className="text-slate-400"
                    />

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Transfer Date
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatDate(
                      transfer.created_at
                    )}
                  </p>
                </div>
              </div>

              {/* REASON */}

              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <FileText
                    size={15}
                    className="text-slate-400"
                  />

                  <p className="text-xs font-semibold text-slate-700">
                    Reason
                  </p>
                </div>

                <div
                  className="
                    mt-2 rounded-xl
                    border border-slate-100
                    bg-slate-50
                    px-4 py-3
                  "
                >
                  <p className="whitespace-pre-wrap text-xs leading-5 text-slate-600">
                    {transfer.reason ||
                      "No reason provided."}
                  </p>
                </div>
              </div>

              {/* TRANSFER ID */}

              <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                <span className="text-[11px] text-slate-400">
                  Transfer reference
                </span>

                <span className="text-xs font-semibold text-slate-700">
                  #{transfer.id}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* FOOTER */}

        <div
          className="
            flex shrink-0 justify-end
            border-t border-slate-100
            px-6 py-4
          "
        >
          <button
            type="button"
            onClick={handleClose}
            className="
              h-10 rounded-xl px-5
              text-sm font-semibold
              text-slate-600
              hover:bg-slate-100
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferDetailsModal;