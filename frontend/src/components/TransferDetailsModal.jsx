import { useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  User,
  X,
  XCircle,
} from "lucide-react";

import api from "../services/api";


// =========================================================
// HELPERS
// =========================================================

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


const formatQuantity = (value) => {

  return Number(
    value ?? 0
  ).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 3,
    }
  );
};


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


// =========================================================
// STATUS
// =========================================================

const getStatusClasses = (
  status
) => {

  switch (
    String(status || "").toUpperCase()
  ) {

    case "REQUESTED":

      return {
        wrapper:
          "bg-amber-50 text-amber-700 border-amber-100",
        dot:
          "bg-amber-500",
        label:
          "REQUESTED",
      };


    case "APPROVED":

      return {
        wrapper:
          "bg-blue-50 text-blue-700 border-blue-100",
        dot:
          "bg-blue-500",
        label:
          "APPROVED",
      };


    case "FULFILLED":

      return {
        wrapper:
          "bg-emerald-50 text-emerald-700 border-emerald-100",
        dot:
          "bg-emerald-500",
        label:
          "FULFILLED",
      };


    case "REJECTED":

      return {
        wrapper:
          "bg-red-50 text-red-700 border-red-100",
        dot:
          "bg-red-500",
        label:
          "REJECTED",
      };


    default:

      return {
        wrapper:
          "bg-slate-100 text-slate-600 border-slate-200",
        dot:
          "bg-slate-400",
        label:
          status || "UNKNOWN",
      };

  }

};


// =========================================================
// COMPONENT
// =========================================================

const TransferDetailsModal = ({
  transfer,
  isOpen,
  onClose,
  onUpdated,
}) => {

  const [details, setDetails] =
    useState(transfer || null);

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] =
    useState("");

  const [showRejectForm, setShowRejectForm] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");


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


  const canApprove =
    role === "ADMIN" ||
    role === "MANAGER";


  const canFulfill =
    role === "STORE_KEEPER";


  // =======================================================
  // LOAD TRANSFER
  // =======================================================

  const loadTransfer = async (
    showRefresh = false
  ) => {

    if (!transfer?.id) {
      return;
    }


    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }


      setError("");


      const response =
        await api.get(
          `/transfers/${transfer.id}`
        );


      const data =
        response.data?.data;


      setDetails(data || transfer);


    } catch (err) {

      console.error(
        "Failed to load transfer details:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to load transfer details."
      );


    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  // =======================================================
  // OPEN
  // =======================================================

  useEffect(() => {

    if (
      isOpen &&
      transfer?.id
    ) {

      setDetails(transfer);

      setShowRejectForm(false);
      setRejectionReason("");

      loadTransfer();

    }

  }, [
    isOpen,
    transfer?.id,
  ]);


  // =======================================================
  // ACTION
  // =======================================================

  const runAction = async (
    action,
    endpoint,
    options = {}
  ) => {

    try {

      setActionLoading(action);
      setError("");


      const response =
        await api.patch(
          endpoint,
          options.body
            ? options.body
            : undefined
        );


      const updated =
        response.data?.data;


      if (updated) {
        setDetails(updated);
      } else {
        await loadTransfer();
      }


      if (onUpdated) {
        await onUpdated(updated);
      }


      setShowRejectForm(false);
      setRejectionReason("");


    } catch (err) {

      console.error(
        `Failed to ${action} transfer:`,
        err
      );


      setError(
        err.response?.data?.message ||
        `Unable to ${action} transfer.`
      );

    } finally {

      setActionLoading("");

    }

  };


  // =======================================================
  // APPROVE
  // =======================================================

  const handleApprove = async () => {

    if (!details?.id) {
      return;
    }


    const confirmed =
      window.confirm(
        `Approve transfer #${details.id}?\n\n` +
        `${formatQuantity(details.quantity)} ${
          details.unit || ""
        } ${details.ingredient} will be reserved ` +
        `from ${details.from_location} for ${details.to_location}.`
      );


    if (!confirmed) {
      return;
    }


    await runAction(
      "approve",
      `/transfers/${details.id}/approve`
    );

  };


  // =======================================================
  // REJECT
  // =======================================================

  const handleReject = async () => {

    if (!details?.id) {
      return;
    }


    if (
      !rejectionReason.trim()
    ) {

      setError(
        "Please provide a reason for rejecting this request."
      );

      return;
    }


    const confirmed =
      window.confirm(
        `Reject transfer #${details.id}?`
      );


    if (!confirmed) {
      return;
    }


    await runAction(
      "reject",
      `/transfers/${details.id}/reject`,
      {
        body: {
          rejectionReason:
            rejectionReason.trim(),
        },
      }
    );

  };


  // =======================================================
  // FULFILL
  // =======================================================

  const handleFulfill = async () => {

    if (!details?.id) {
      return;
    }


    const confirmed =
      window.confirm(
        `Fulfill transfer #${details.id}?\n\n` +
        `${formatQuantity(details.quantity)} ${
          details.unit || ""
        } ${details.ingredient}\n\n` +
        `${details.from_location} → ${details.to_location}\n\n` +
        `This will physically update inventory at both locations.`
      );


    if (!confirmed) {
      return;
    }


    await runAction(
      "fulfill",
      `/transfers/${details.id}/fulfill`
    );

  };


  // =======================================================
  // CLOSED
  // =======================================================

  if (
    !isOpen ||
    !transfer
  ) {

    return null;

  }


  const status =
    String(
      details?.status ||
      transfer.status ||
      ""
    ).toUpperCase();


  const statusClasses =
    getStatusClasses(status);


  const movements =
    Array.isArray(
      details?.movements
    )
      ? details.movements
      : [];


  const isBusy =
    Boolean(actionLoading);


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div
      className="
        fixed
        inset-0
        z-[80]
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

          onClose();

        }

      }}
    >

      <div
        className="
          flex
          max-h-[94vh]
          w-full
          max-w-5xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

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
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-violet-50
                text-violet-600
              "
            >

              <ArrowUpRight size={20} />

            </div>


            <div>

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-slate-900
                  "
                >
                  Transfer #{details?.id}
                </h2>


                <span
                  className={`
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    px-2.5
                    py-1
                    text-[10px]
                    font-bold
                    ${statusClasses.wrapper}
                  `}
                >

                  <span
                    className={`
                      h-1.5
                      w-1.5
                      rounded-full
                      ${statusClasses.dot}
                    `}
                  />

                  {statusClasses.label}

                </span>

              </div>


              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                "
              >
                Complete stock request and fulfillment audit.
              </p>

            </div>

          </div>


          <div className="flex items-center gap-1">

            <button
              type="button"
              onClick={() =>
                loadTransfer(true)
              }
              disabled={
                refreshing ||
                isBusy
              }
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                text-slate-400
                hover:bg-slate-100
                hover:text-slate-700
                disabled:opacity-50
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

            </button>


            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                text-slate-400
                hover:bg-slate-100
                hover:text-slate-700
              "
            >

              <X size={18} />

            </button>

          </div>

        </div>


        {/* =================================================
            BODY
        ================================================= */}

        <div
          className="
            overflow-y-auto
            px-6
            py-6
          "
        >

          {loading && !details ? (

            <div
              className="
                flex
                min-h-[300px]
                items-center
                justify-center
              "
            >

              <Loader2
                size={24}
                className="
                  animate-spin
                  text-violet-500
                "
              />

            </div>

          ) : (

            <>

              {/* ERROR */}

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
                    className="mt-0.5 shrink-0"
                  />

                  <p>
                    {error}
                  </p>

                </div>

              )}


              {/* =================================================
                  TRANSFER SUMMARY
              ================================================= */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50/70
                  p-5
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    gap-5
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                  "
                >

                  <div>

                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-400
                      "
                    >
                      Ingredient
                    </p>


                    <div
                      className="
                        mt-1.5
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <Package
                        size={18}
                        className="text-violet-500"
                      />

                      <span
                        className="
                          text-base
                          font-bold
                          text-slate-900
                        "
                      >
                        {details?.ingredient}
                      </span>

                    </div>


                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-400
                      "
                    >
                      Quantity:{" "}
                      <span className="font-semibold">
                        {formatQuantity(
                          details?.quantity
                        )}{" "}
                        {details?.unit || ""}
                      </span>
                    </p>

                  </div>


                  <div
                    className="
                      flex
                      flex-col
                      items-start
                      gap-2
                      sm:flex-row
                      sm:items-center
                    "
                  >

                    <div
                      className="
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                      "
                    >

                      <p
                        className="
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-wide
                          text-slate-400
                        "
                      >
                        From
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-semibold
                          text-slate-800
                        "
                      >
                        {details?.from_location}
                      </p>

                    </div>


                    <ArrowRight
                      size={18}
                      className="
                        hidden
                        text-slate-300
                        sm:block
                      "
                    />


                    <div
                      className="
                        rounded-xl
                        border
                        border-emerald-100
                        bg-emerald-50/60
                        px-4
                        py-3
                      "
                    >

                      <p
                        className="
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-wide
                          text-emerald-600
                        "
                      >
                        To
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-semibold
                          text-slate-800
                        "
                      >
                        {details?.to_location}
                      </p>

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  LIFECYCLE
              ================================================= */}

              <div className="mt-6">

                <h3
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  Request Audit
                </h3>


                <p
                  className="
                    mt-0.5
                    text-xs
                    text-slate-400
                  "
                >
                  Every stage of this stock request.
                </p>


                <div
                  className="
                    mt-4
                    grid
                    grid-cols-1
                    gap-3
                    md:grid-cols-2
                  "
                >

                  {/* REQUEST */}

                  <div
                    className="
                      rounded-xl
                      border
                      border-slate-100
                      bg-white
                      p-4
                    "
                  >

                    <div className="flex items-center gap-2">

                      <div
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          bg-amber-50
                          text-amber-600
                        "
                      >

                        <Send size={14} />

                      </div>


                      <div>

                        <p
                          className="
                            text-xs
                            font-semibold
                            text-slate-800
                          "
                        >
                          Request
                        </p>

                        <p
                          className="
                            text-[10px]
                            text-slate-400
                          "
                        >
                          {formatDate(
                            details?.requested_at
                          )}
                        </p>

                      </div>

                    </div>


                    <div className="mt-4">

                      <p
                        className="
                          text-[10px]
                          uppercase
                          tracking-wide
                          text-slate-400
                        "
                      >
                        Requested by
                      </p>


                      <p
                        className="
                          mt-1
                          text-sm
                          font-semibold
                          text-slate-700
                        "
                      >
                        {details?.requested_by_name ||
                          "—"}
                      </p>


                      {details?.requested_by_email && (

                        <p
                          className="
                            mt-0.5
                            text-xs
                            text-slate-400
                          "
                        >
                          {details.requested_by_email}
                        </p>

                      )}

                    </div>

                  </div>


                  {/* APPROVAL */}

                  <div
                    className="
                      rounded-xl
                      border
                      border-slate-100
                      bg-white
                      p-4
                    "
                  >

                    <div className="flex items-center gap-2">

                      <div
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          bg-blue-50
                          text-blue-600
                        "
                      >

                        <ShieldCheck size={14} />

                      </div>


                      <div>

                        <p
                          className="
                            text-xs
                            font-semibold
                            text-slate-800
                          "
                        >
                          Approval
                        </p>

                        <p
                          className="
                            text-[10px]
                            text-slate-400
                          "
                        >
                          {details?.approved_at
                            ? formatDate(
                                details.approved_at
                              )
                            : "Pending"}
                        </p>

                      </div>

                    </div>


                    <div className="mt-4">

                      {details?.approved_by_name ? (

                        <>

                          <p
                            className="
                              text-[10px]
                              uppercase
                              tracking-wide
                              text-slate-400
                            "
                          >
                            Approved by
                          </p>


                          <p
                            className="
                              mt-1
                              text-sm
                              font-semibold
                              text-slate-700
                            "
                          >
                            {details.approved_by_name}
                          </p>

                        </>

                      ) : (

                        <p
                          className="
                            text-sm
                            font-medium
                            text-amber-600
                          "
                        >
                          Awaiting approval
                        </p>

                      )}

                    </div>

                  </div>


                  {/* REJECTION */}

                  {details?.rejected_by_name && (

                    <div
                      className="
                        rounded-xl
                        border
                        border-red-100
                        bg-red-50/50
                        p-4
                      "
                    >

                      <div className="flex items-center gap-2">

                        <div
                          className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            bg-red-100
                            text-red-600
                          "
                        >

                          <XCircle size={14} />

                        </div>


                        <div>

                          <p
                            className="
                              text-xs
                              font-semibold
                              text-slate-800
                            "
                          >
                            Rejection
                          </p>

                          <p
                            className="
                              text-[10px]
                              text-slate-400
                            "
                          >
                            {formatDate(
                              details.rejected_at
                            )}
                          </p>

                        </div>

                      </div>


                      <div className="mt-4">

                        <p
                          className="
                            text-[10px]
                            uppercase
                            tracking-wide
                            text-slate-400
                          "
                        >
                          Rejected by
                        </p>


                        <p
                          className="
                            mt-1
                            text-sm
                            font-semibold
                            text-slate-700
                          "
                        >
                          {details.rejected_by_name}
                        </p>


                        <p
                          className="
                            mt-3
                            text-xs
                            leading-5
                            text-red-700
                          "
                        >
                          {details.rejection_reason ||
                            "No rejection reason provided."}
                        </p>

                      </div>

                    </div>

                  )}


                  {/* FULFILLMENT */}

                  <div
                    className="
                      rounded-xl
                      border
                      border-slate-100
                      bg-white
                      p-4
                    "
                  >

                    <div className="flex items-center gap-2">

                      <div
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          bg-emerald-50
                          text-emerald-600
                        "
                      >

                        <Store size={14} />

                      </div>


                      <div>

                        <p
                          className="
                            text-xs
                            font-semibold
                            text-slate-800
                          "
                        >
                          Fulfillment
                        </p>

                        <p
                          className="
                            text-[10px]
                            text-slate-400
                          "
                        >
                          {details?.fulfilled_at
                            ? formatDate(
                                details.fulfilled_at
                              )
                            : "Pending"}
                        </p>

                      </div>

                    </div>


                    <div className="mt-4">

                      {details?.fulfilled_by_name ? (

                        <>

                          <p
                            className="
                              text-[10px]
                              uppercase
                              tracking-wide
                              text-slate-400
                            "
                          >
                            Fulfilled by
                          </p>


                          <p
                            className="
                              mt-1
                              text-sm
                              font-semibold
                              text-slate-700
                            "
                          >
                            {details.fulfilled_by_name}
                          </p>

                        </>

                      ) : (

                        <p
                          className="
                            text-sm
                            font-medium
                            text-slate-500
                          "
                        >
                          Waiting for store keeper
                        </p>

                      )}

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  REASON
              ================================================= */}

              <div
                className="
                  mt-6
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-4
                "
              >

                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Request Reason
                </p>


                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-600
                  "
                >
                  {details?.reason ||
                    "No reason provided."}
                </p>

              </div>


              {/* =================================================
                  PHYSICAL MOVEMENTS
              ================================================= */}

              {movements.length > 0 && (

                <div className="mt-6">

                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-slate-800
                    "
                  >
                    Physical Stock Movement
                  </h3>


                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-400
                    "
                  >
                    Inventory changes recorded when the request was fulfilled.
                  </p>


                  <div
                    className="
                      mt-4
                      overflow-hidden
                      rounded-xl
                      border
                      border-slate-100
                    "
                  >

                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead>

                          <tr
                            className="
                              border-b
                              border-slate-100
                              bg-slate-50
                            "
                          >

                            <th
                              className="
                                px-4 py-3
                                text-left
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-wider
                                text-slate-400
                              "
                            >
                              Location
                            </th>

                            <th
                              className="
                                px-4 py-3
                                text-right
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-wider
                                text-slate-400
                              "
                            >
                              Before
                            </th>

                            <th
                              className="
                                px-4 py-3
                                text-right
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-wider
                                text-slate-400
                              "
                            >
                              Movement
                            </th>

                            <th
                              className="
                                px-4 py-3
                                text-right
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-wider
                                text-slate-400
                              "
                            >
                              After
                            </th>

                            <th
                              className="
                                px-4 py-3
                                text-left
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-wider
                                text-slate-400
                              "
                            >
                              User
                            </th>

                            <th
                              className="
                                px-4 py-3
                                text-left
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-wider
                                text-slate-400
                              "
                            >
                              Date
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {movements.map(
                            (movement) => {

                              const quantity =
                                Number(
                                  movement.quantity
                                );


                              return (

                                <tr
                                  key={movement.id}
                                  className="
                                    border-b
                                    border-slate-50
                                    last:border-0
                                  "
                                >

                                  <td
                                    className="
                                      px-4 py-3
                                    "
                                  >

                                    <div
                                      className="
                                        flex
                                        items-center
                                        gap-2
                                      "
                                    >

                                      {quantity >= 0 ? (

                                        <ArrowDownLeft
                                          size={14}
                                          className="
                                            text-emerald-500
                                          "
                                        />

                                      ) : (

                                        <ArrowUpRight
                                          size={14}
                                          className="
                                            text-red-500
                                          "
                                        />

                                      )}


                                      <span
                                        className="
                                          text-xs
                                          font-semibold
                                          text-slate-700
                                        "
                                      >
                                        {movement.location}
                                      </span>

                                    </div>

                                  </td>


                                  <td
                                    className="
                                      px-4 py-3
                                      text-right
                                      text-xs
                                      text-slate-500
                                    "
                                  >
                                    {formatQuantity(
                                      movement.previous_quantity
                                    )}
                                  </td>


                                  <td
                                    className={`
                                      px-4 py-3
                                      text-right
                                      text-xs
                                      font-semibold
                                      ${
                                        quantity >= 0
                                          ? "text-emerald-600"
                                          : "text-red-600"
                                      }
                                    `}
                                  >

                                    {quantity >= 0
                                      ? "+"
                                      : ""}

                                    {formatQuantity(
                                      quantity
                                    )}

                                  </td>


                                  <td
                                    className="
                                      px-4 py-3
                                      text-right
                                      text-xs
                                      font-semibold
                                      text-slate-700
                                    "
                                  >
                                    {formatQuantity(
                                      movement.new_quantity
                                    )}
                                  </td>


                                  <td
                                    className="
                                      px-4 py-3
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


                                      <span
                                        className="
                                          text-xs
                                          font-medium
                                          text-slate-600
                                        "
                                      >
                                        {movement.created_by_name ||
                                          "System"}
                                      </span>

                                    </div>

                                  </td>


                                  <td
                                    className="
                                      whitespace-nowrap
                                      px-4 py-3
                                      text-xs
                                      text-slate-500
                                    "
                                  >
                                    {formatDate(
                                      movement.created_at
                                    )}
                                  </td>

                                </tr>

                              );

                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  CREATED / UPDATED
              ================================================= */}

              <div
                className="
                  mt-6
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-2
                "
              >

                <div
                  className="
                    rounded-xl
                    border
                    border-slate-100
                    bg-slate-50
                    p-4
                  "
                >

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Created
                  </p>


                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    {formatDate(
                      details?.created_at
                    )}
                  </p>

                </div>


                <div
                  className="
                    rounded-xl
                    border
                    border-slate-100
                    bg-slate-50
                    p-4
                  "
                >

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Last Updated
                  </p>


                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    {formatDate(
                      details?.updated_at
                    )}
                  </p>

                </div>

              </div>

            </>

          )}

        </div>


        {/* =================================================
            FOOTER / ACTIONS
        ================================================= */}

        <div
          className="
            flex
            shrink-0
            flex-col
            gap-3
            border-t
            border-slate-100
            px-6
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="
              h-10
              rounded-xl
              px-4
              text-sm
              font-semibold
              text-slate-600
              hover:bg-slate-100
              disabled:opacity-50
            "
          >
            Close
          </button>


          {/* =================================================
              ADMIN / MANAGER ACTIONS
          ================================================= */}

          {canApprove &&
            status === "REQUESTED" && (

              <div className="flex items-center gap-2">

                {!showRejectForm && (

                  <button
                    type="button"
                    onClick={() =>
                      setShowRejectForm(true)
                    }
                    disabled={isBusy}
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
                      hover:bg-red-50
                      disabled:opacity-50
                    "
                  >

                    <XCircle size={15} />

                    Reject

                  </button>

                )}


                {!showRejectForm && (

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isBusy}
                    className="
                      inline-flex
                      h-10
                      items-center
                      gap-2
                      rounded-xl
                      bg-blue-600
                      px-5
                      text-sm
                      font-semibold
                      text-white
                      shadow-sm
                      hover:bg-blue-700
                      disabled:opacity-60
                    "
                  >

                    {actionLoading === "approve" ? (

                      <Loader2
                        size={15}
                        className="animate-spin"
                      />

                    ) : (

                      <Check
                        size={15}
                      />

                    )}

                    Approve Request

                  </button>

                )}


                {showRejectForm && (

                  <div
                    className="
                      flex
                      w-full
                      flex-col
                      gap-2
                      sm:w-auto
                      sm:flex-row
                    "
                  >

                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(
                          event.target.value
                        )
                      }
                      placeholder="Reason for rejection"
                      className="
                        h-10
                        min-w-[240px]
                        rounded-xl
                        border
                        border-slate-200
                        px-3
                        text-sm
                        outline-none
                        focus:border-red-300
                        focus:ring-4
                        focus:ring-red-500/10
                      "
                    />


                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={
                        isBusy ||
                        !rejectionReason.trim()
                      }
                      className="
                        inline-flex
                        h-10
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-red-600
                        px-4
                        text-sm
                        font-semibold
                        text-white
                        hover:bg-red-700
                        disabled:opacity-60
                      "
                    >

                      {actionLoading === "reject" ? (

                        <Loader2
                          size={15}
                          className="animate-spin"
                        />

                      ) : (

                        <XCircle
                          size={15}
                        />

                      )}

                      Confirm Reject

                    </button>


                    <button
                      type="button"
                      onClick={() => {

                        setShowRejectForm(
                          false
                        );

                        setRejectionReason("");

                      }}
                      disabled={isBusy}
                      className="
                        h-10
                        rounded-xl
                        px-3
                        text-sm
                        font-semibold
                        text-slate-500
                        hover:bg-slate-100
                      "
                    >
                      Cancel
                    </button>

                  </div>

                )}

              </div>

            )}


          {/* =================================================
              STORE KEEPER ACTION
          ================================================= */}

          {canFulfill &&
            status === "APPROVED" && (

              <button
                type="button"
                onClick={handleFulfill}
                disabled={isBusy}
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
                  hover:bg-emerald-700
                  disabled:opacity-60
                "
              >

                {actionLoading === "fulfill" ? (

                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                ) : (

                  <CheckCircle2
                    size={15}
                  />

                )}

                Fulfill Transfer

              </button>

            )}

        </div>

      </div>

    </div>

  );

};


export default TransferDetailsModal;