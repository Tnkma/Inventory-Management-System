import { useEffect, useState } from "react";
import {
  X,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock3,
  Package,
  AlertCircle,
  User,
  CalendarDays,
  MapPin,
  FileCheck2,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const PurchaseDetails = ({
  purchaseId,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();

  const [purchase, setPurchase] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================================================
  // ROLE
  // =========================================================

  const userRole =
    String(
      user?.role || ""
    ).toUpperCase();

  const canApprove =
    userRole === "ADMIN" ||
    userRole === "MANAGER";

  // =========================================================
  // LOAD PURCHASE
  // =========================================================

  const loadPurchase = async () => {
    if (!purchaseId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/purchases/${purchaseId}`
        );

      setPurchase(
        response.data?.data || null
      );
    } catch (err) {
      console.error(
        "Failed to load purchase:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load purchase."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !purchaseId) {
      return;
    }

    loadPurchase();
  }, [isOpen, purchaseId]);

  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {
    if (actionLoading) {
      return;
    }

    setPurchase(null);
    setError("");

    onClose();
  };

  // =========================================================
  // FORMAT
  // =========================================================

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString(
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
  // APPROVE / RECEIVE
  // =========================================================

  const handleComplete = async () => {
    if (!purchase) {
      return;
    }

    if (!canApprove) {
      setError(
        "You do not have permission to approve this purchase."
      );

      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.patch(
        `/purchases/${purchase.id}/complete`
      );

      await loadPurchase();

      if (onUpdated) {
        await onUpdated();
      }

    } catch (err) {
      console.error(
        "Failed to approve purchase:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to approve and receive purchase."
      );

    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = async () => {
    if (!purchase) {
      return;
    }

    if (!canApprove) {
      setError(
        "You do not have permission to cancel this purchase."
      );

      return;
    }

    const reason =
      window.prompt(
        "Reason for cancelling this purchase:"
      );

    if (reason === null) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.patch(
        `/purchases/${purchase.id}/cancel`,
        {
          reason:
            reason.trim() || null,
        }
      );

      await loadPurchase();

      if (onUpdated) {
        await onUpdated();
      }

    } catch (err) {
      console.error(
        "Failed to cancel purchase:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to cancel purchase."
      );

    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const status =
    String(
      purchase?.status || ""
    ).toUpperCase();

  const isPending =
    status === "PENDING";

  const isCompleted =
    status === "COMPLETED";

  const isCancelled =
    status === "CANCELLED";

  // =========================================================
  // APPROVAL / RECEIPT FIELDS
  //
  // These are intentionally defensive because the current
  // backend response shown earlier does not yet return all
  // approval fields.
  // =========================================================

  const approvedBy =
    purchase?.approved_by ||
    purchase?.approved_by_name ||
    purchase?.completed_by ||
    purchase?.completed_by_name ||
    null;

  const approvedAt =
    purchase?.approved_at ||
    purchase?.completed_at ||
    null;

  const receivedAt =
    purchase?.received_at ||
    purchase?.completed_at ||
    null;

  const receivingLocation =
    purchase?.receiving_location ||
    purchase?.receiving_location_name ||
    null;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="
        fixed
        inset-0
        z-[60]
        flex
        items-center
        justify-center
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
          flex
          max-h-[90vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-slate-100
            px-6
            py-5
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

              <h2 className="
                text-base
                font-semibold
                text-slate-900
              ">
                Purchase #{purchaseId}
              </h2>

              <p className="
                mt-0.5
                text-xs
                text-slate-500
              ">
                Stock receipt details
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={actionLoading}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X size={18} />
          </button>

        </div>


        {/* =====================================================
            BODY
        ===================================================== */}

        <div className="
          overflow-y-auto
          px-6
          py-6
        ">

          {/* LOADING */}

          {loading ? (

            <div className="
              flex
              min-h-[300px]
              items-center
              justify-center
            ">

              <div className="text-center">

                <RefreshCw
                  size={22}
                  className="
                    mx-auto
                    animate-spin
                    text-blue-600
                  "
                />

                <p className="
                  mt-3
                  text-sm
                  font-semibold
                  text-slate-700
                ">
                  Loading purchase...
                </p>

              </div>

            </div>

          ) : error && !purchase ? (

            <div
              className="
                rounded-xl
                border
                border-red-100
                bg-red-50
                px-4
                py-4
                text-sm
                text-red-700
              "
            >

              <div className="
                flex
                items-center
                gap-2
              ">

                <AlertCircle size={17} />

                {error}

              </div>

            </div>

          ) : purchase ? (

            <>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (

                <div
                  className="
                    mb-5
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    border
                    border-red-100
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-700
                  "
                >

                  <AlertCircle
                    size={17}
                    className="
                      mt-0.5
                      shrink-0
                    "
                  />

                  <p>{error}</p>

                </div>

              )}


              {/* =================================================
                  STATUS
              ================================================= */}

              <div
                className={`
                  flex
                  items-center
                  justify-between
                  gap-4
                  rounded-xl
                  border
                  px-5
                  py-4

                  ${
                    isCompleted
                      ? "border-emerald-100 bg-emerald-50/60"
                      : isCancelled
                        ? "border-red-100 bg-red-50/60"
                        : "border-amber-100 bg-amber-50/60"
                  }
                `}
              >

                <div className="
                  flex
                  items-center
                  gap-3
                ">

                  {isCompleted ? (

                    <CheckCircle2
                      size={20}
                      className="text-emerald-600"
                    />

                  ) : isCancelled ? (

                    <XCircle
                      size={20}
                      className="text-red-600"
                    />

                  ) : (

                    <Clock3
                      size={20}
                      className="text-amber-600"
                    />

                  )}

                  <div>

                    <p className="
                      text-sm
                      font-semibold
                      text-slate-800
                    ">

                      {isCompleted
                        ? "Purchase approved and received"
                        : isCancelled
                          ? "Purchase cancelled"
                          : "Awaiting approval"}

                    </p>

                    <p className="
                      mt-0.5
                      text-xs
                      text-slate-500
                    ">

                      {isCompleted
                        ? "The approved stock has been received into the Main Store."
                        : isCancelled
                          ? "This purchase will not be received into inventory."
                          : "This receipt is waiting for approval by a manager or administrator."}

                    </p>

                  </div>

                </div>


                <span
                  className={`
                    shrink-0
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-semibold

                    ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : isCancelled
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }
                  `}
                >
                  {purchase.status}
                </span>

              </div>


              {/* =================================================
                  BASIC INFORMATION
              ================================================= */}

              <div className="
                mt-5
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              ">

                {/* SUPPLIER */}

                <div className="
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-4
                ">

                  <p className="
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                  ">
                    Supplier
                  </p>

                  <p className="
                    mt-1.5
                    text-sm
                    font-semibold
                    text-slate-800
                  ">
                    {purchase.supplier || "—"}
                  </p>

                </div>


                {/* SUBMITTED BY */}

                <div className="
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-4
                ">

                  <div className="
                    flex
                    items-center
                    gap-1.5
                  ">

                    <User
                      size={13}
                      className="text-slate-400"
                    />

                    <p className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-slate-400
                    ">
                      Submitted By
                    </p>

                  </div>

                  <p className="
                    mt-1.5
                    text-sm
                    font-semibold
                    text-slate-800
                  ">
                    {purchase.created_by || "—"}
                  </p>

                </div>


                {/* PURCHASE DATE */}

                <div className="
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-4
                ">

                  <div className="
                    flex
                    items-center
                    gap-1.5
                  ">

                    <CalendarDays
                      size={13}
                      className="text-slate-400"
                    />

                    <p className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-slate-400
                    ">
                      Purchase Date
                    </p>

                  </div>

                  <p className="
                    mt-1.5
                    text-sm
                    font-semibold
                    text-slate-800
                  ">
                    {formatDate(
                      purchase.purchase_date
                    )}
                  </p>

                </div>


                {/* CREATED */}

                <div className="
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-4
                ">

                  <p className="
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                  ">
                    Record Created
                  </p>

                  <p className="
                    mt-1.5
                    text-sm
                    font-semibold
                    text-slate-800
                  ">
                    {formatDate(
                      purchase.created_at
                    )}
                  </p>

                </div>

              </div>


              {/* =================================================
                  APPROVAL / RECEIPT INFORMATION
              ================================================= */}

              {isCompleted && (

                <div className="
                  mt-5
                  rounded-xl
                  border
                  border-emerald-100
                  bg-emerald-50/50
                  p-5
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <FileCheck2
                      size={17}
                      className="
                        text-emerald-600
                      "
                    />

                    <h3 className="
                      text-sm
                      font-semibold
                      text-slate-900
                    ">
                      Approval & Receipt
                    </h3>

                  </div>


                  <div className="
                    mt-4
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                  ">

                    {/* APPROVED BY */}

                    <div>

                      <p className="
                        text-[11px]
                        font-medium
                        uppercase
                        tracking-wide
                        text-slate-400
                      ">
                        Approved By
                      </p>

                      <p className="
                        mt-1
                        text-sm
                        font-semibold
                        text-slate-800
                      ">
                        {approvedBy ||
                          "Approval information not available"}
                      </p>

                    </div>


                    {/* APPROVED DATE */}

                    <div>

                      <p className="
                        text-[11px]
                        font-medium
                        uppercase
                        tracking-wide
                        text-slate-400
                      ">
                        Approval Date
                      </p>

                      <p className="
                        mt-1
                        text-sm
                        font-semibold
                        text-slate-800
                      ">
                        {approvedAt
                          ? formatDate(approvedAt)
                          : "Approval information not available"}
                      </p>

                    </div>


                    {/* RECEIVING LOCATION */}

                    <div>

                      <div className="
                        flex
                        items-center
                        gap-1.5
                      ">

                        <MapPin
                          size={13}
                          className="
                            text-slate-400
                          "
                        />

                        <p className="
                          text-[11px]
                          font-medium
                          uppercase
                          tracking-wide
                          text-slate-400
                        ">
                          Received Into
                        </p>

                      </div>

                      <p className="
                        mt-1
                        text-sm
                        font-semibold
                        text-slate-800
                      ">
                        {receivingLocation ||
                          "Main Store"}
                      </p>

                    </div>


                    {/* RECEIVED DATE */}

                    <div>

                      <p className="
                        text-[11px]
                        font-medium
                        uppercase
                        tracking-wide
                        text-slate-400
                      ">
                        Received Date
                      </p>

                      <p className="
                        mt-1
                        text-sm
                        font-semibold
                        text-slate-800
                      ">
                        {receivedAt
                          ? formatDate(receivedAt)
                          : "Receipt date not available"}
                      </p>

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  ITEMS
              ================================================= */}

              <div className="mt-6">

                <div className="
                  flex
                  items-center
                  gap-2
                ">

                  <Package
                    size={17}
                    className="text-slate-400"
                  />

                  <h3 className="
                    text-sm
                    font-semibold
                    text-slate-900
                  ">
                    Purchase Items
                  </h3>

                </div>


                <div className="
                  mt-3
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200
                ">

                  {/* TABLE HEADER */}

                  <div
                    className="
                      hidden
                      grid-cols-[1fr_100px_120px_120px]
                      gap-4
                      border-b
                      border-slate-100
                      bg-slate-50
                      px-4
                      py-3
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-400
                      sm:grid
                    "
                  >

                    <span>
                      Ingredient
                    </span>

                    <span>
                      Quantity
                    </span>

                    <span>
                      Unit Price
                    </span>

                    <span className="text-right">
                      Total
                    </span>

                  </div>


                  {/* ITEMS */}

                  <div className="
                    divide-y
                    divide-slate-100
                  ">

                    {(purchase.items || []).length === 0 ? (

                      <div className="
                        px-4
                        py-8
                        text-center
                      ">

                        <Package
                          size={22}
                          className="
                            mx-auto
                            text-slate-300
                          "
                        />

                        <p className="
                          mt-2
                          text-xs
                          font-semibold
                          text-slate-500
                        ">
                          No purchase items
                        </p>

                      </div>

                    ) : (

                      (purchase.items || []).map(
                        (item) => (

                          <div
                            key={item.id}
                            className="
                              grid
                              grid-cols-1
                              gap-2
                              px-4
                              py-4
                              sm:grid-cols-[1fr_100px_120px_120px]
                              sm:items-center
                              sm:gap-4
                            "
                          >

                            <div>

                              <p className="
                                text-xs
                                font-semibold
                                text-slate-800
                              ">
                                {item.ingredient}
                              </p>

                              <p className="
                                mt-0.5
                                text-[10px]
                                text-slate-400
                              ">
                                {item.sku ||
                                  "No SKU"}
                              </p>

                            </div>


                            <div>

                              <span className="
                                text-[10px]
                                text-slate-400
                                sm:hidden
                              ">
                                Quantity:{" "}
                              </span>

                              <span className="
                                text-xs
                                text-slate-700
                              ">
                                {Number(
                                  item.quantity || 0
                                ).toLocaleString()}{" "}
                                {item.unit || ""}
                              </span>

                            </div>


                            <div>

                              <span className="
                                text-[10px]
                                text-slate-400
                                sm:hidden
                              ">
                                Unit price:{" "}
                              </span>

                              <span className="
                                text-xs
                                text-slate-700
                              ">
                                {formatCurrency(
                                  item.unit_price
                                )}
                              </span>

                            </div>


                            <div className="sm:text-right">

                              <span className="
                                text-[10px]
                                text-slate-400
                                sm:hidden
                              ">
                                Total:{" "}
                              </span>

                              <span className="
                                text-xs
                                font-semibold
                                text-slate-800
                              ">
                                {formatCurrency(
                                  item.total_price
                                )}
                              </span>

                            </div>

                          </div>

                        )
                      )

                    )}

                  </div>

                </div>

              </div>


              {/* =================================================
                  TOTAL
              ================================================= */}

              <div className="
                mt-5
                flex
                justify-end
              ">

                <div
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                    sm:w-72
                  "
                >

                  <div className="
                    flex
                    items-center
                    justify-between
                  ">

                    <span className="
                      text-xs
                      text-slate-500
                    ">
                      Total Purchase
                    </span>

                    <span className="
                      text-lg
                      font-bold
                      text-slate-900
                    ">
                      {formatCurrency(
                        purchase.total_amount
                      )}
                    </span>

                  </div>

                </div>

              </div>


              {/* =================================================
                  NOTES
              ================================================= */}

              {purchase.notes && (

                <div className="mt-5">

                  <p className="
                    text-xs
                    font-semibold
                    text-slate-700
                  ">
                    Notes
                  </p>

                  <div
                    className="
                      mt-2
                      rounded-xl
                      border
                      border-slate-100
                      bg-slate-50
                      px-4
                      py-3
                    "
                  >

                    <p className="
                      whitespace-pre-wrap
                      text-xs
                      text-slate-600
                    ">
                      {purchase.notes}
                    </p>

                  </div>

                </div>

              )}

            </>

          ) : null}

        </div>


        {/* =====================================================
            FOOTER
        ===================================================== */}

        {purchase && (

          <div
            className="
              flex
              shrink-0
              items-center
              justify-between
              border-t
              border-slate-100
              px-6
              py-4
            "
          >

            <button
              type="button"
              onClick={handleClose}
              disabled={actionLoading}
              className="
                h-10
                rounded-xl
                px-4
                text-sm
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Close
            </button>


            {/* =================================================
                MANAGER / ADMIN ACTIONS ONLY
            ================================================= */}

            {isPending && canApprove && (

              <div className="
                flex
                items-center
                gap-2
              ">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="
                    inline-flex
                    h-10
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-red-200
                    bg-white
                    px-4
                    text-sm
                    font-semibold
                    text-red-600
                    transition
                    hover:bg-red-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  <XCircle size={15} />

                  Cancel

                </button>


                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="
                    inline-flex
                    h-10
                    items-center
                    gap-2
                    rounded-xl
                    bg-emerald-600
                    px-5
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-emerald-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  {actionLoading ? (

                    <>
                      <RefreshCw
                        size={15}
                        className="
                          animate-spin
                        "
                      />

                      Processing...
                    </>

                  ) : (

                    <>
                      <CheckCircle2
                        size={15}
                      />

                      Approve & Receive
                    </>

                  )}

                </button>

              </div>

            )}


            {/* =================================================
                PENDING BUT NO APPROVAL PERMISSION
            ================================================= */}

            {isPending && !canApprove && (

              <div className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-amber-50
                px-3
                py-2
                text-xs
                font-medium
                text-amber-700
              ">

                <Clock3 size={14} />

                Awaiting manager approval

              </div>

            )}


            {/* =================================================
                COMPLETED
            ================================================= */}

            {isCompleted && (

              <div className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-emerald-50
                px-3
                py-2
                text-xs
                font-medium
                text-emerald-700
              ">

                <CheckCircle2 size={14} />

                Approved & received

              </div>

            )}


            {/* =================================================
                CANCELLED
            ================================================= */}

            {isCancelled && (

              <div className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-red-50
                px-3
                py-2
                text-xs
                font-medium
                text-red-700
              ">

                <XCircle size={14} />

                Purchase cancelled

              </div>

            )}

          </div>

        )}

      </div>

    </div>
  );
};

export default PurchaseDetails;