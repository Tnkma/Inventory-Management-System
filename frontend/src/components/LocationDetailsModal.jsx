import { useEffect, useMemo, useState } from "react";

import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
  User,
  X,
  XCircle,
  ArrowLeftRight,
  AlertTriangle,
} from "lucide-react";

import api from "../services/api";


// =========================================================
// HELPERS
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

  const number =
    Number(value ?? 0);

  return number.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 3
    }
  );
};


// =========================================================
// MOVEMENT DISPLAY
// =========================================================

const getMovementLabel = (movement) => {

  switch (movement.movement_type) {

    case "PURCHASE":
      return "Purchase";

    case "TRANSFER":
      return "Transfer";

    case "CONSUMPTION":
      return "Consumption";

    case "WASTAGE":
      return "Wastage";

    case "ADJUSTMENT":
      return "Adjustment";

    case "RETURN":
      return "Return";

    default:
      return movement.movement_type || "Movement";
  }
};


const getMovementDescription = (
  movement,
  location
) => {

  switch (movement.movement_type) {

    case "PURCHASE":

      return movement.supplier_name
        ? `${movement.supplier_name} → ${location.name}`
        : `Supplier → ${location.name}`;


    case "TRANSFER":

      if (
        movement.from_location &&
        movement.to_location
      ) {

        return (
          `${movement.from_location} → ` +
          `${movement.to_location}`
        );
      }

      return "Location transfer";


    case "CONSUMPTION":

      return `${location.name} → Consumed`;


    case "WASTAGE":

      return `${location.name} → Wastage`;


    case "RETURN":

      return `Return → ${location.name}`;


    case "ADJUSTMENT":

      return `${location.name} → Stock adjustment`;


    default:

      return location.name;
  }
};


const getMovementIcon = (
  movement
) => {

  switch (movement.movement_type) {

    case "PURCHASE":
      return ShoppingCart;

    case "TRANSFER":
      return ArrowLeftRight;

    case "CONSUMPTION":
      return ArrowUpRight;

    case "WASTAGE":
      return AlertTriangle;

    case "RETURN":
      return ArrowDownLeft;

    default:
      return Package;
  }
};


// =========================================================
// COMPONENT
// =========================================================

const LocationDetailsModal = ({
  location,
  isOpen,
  canManage,

  onClose,
  onEdit,
  onToggleStatus,

  // -------------------------------------------------------
  // Parent controls these modals.
  // -------------------------------------------------------

  onOpenPurchase,
  onOpenTransfer
}) => {

  const [stock, setStock] =
    useState([]);

  const [movements, setMovements] =
    useState([]);

  const [loadingStock, setLoadingStock] =
    useState(false);

  const [loadingMovements, setLoadingMovements] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  // =======================================================
  // LOAD LOCATION DATA
  // =======================================================

  const loadLocationData = async (
    showRefresh = false
  ) => {

    if (!location?.id) {
      return;
    }


    try {

      if (showRefresh) {
        setRefreshing(true);
      }

      setError("");


      // ---------------------------------------------------
      // Current inventory + movement history
      // ---------------------------------------------------

      setLoadingStock(true);
      setLoadingMovements(true);


      const [
        inventoryResponse,
        movementsResponse
      ] = await Promise.all([

        api.get("/inventory"),

        api.get(
          "/inventory/movements",
          {
            params: {
              locationId: location.id
            }
          }
        )

      ]);


      const allInventory =
        inventoryResponse.data?.data || [];

      const locationInventory =
        allInventory.filter(
          (item) =>
            Number(item.location_id) ===
            Number(location.id)
        );


      setStock(locationInventory);


      setMovements(
        movementsResponse.data?.data || []
      );


    } catch (err) {

      console.error(
        "Failed to load location details:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load location stock activity."
      );

    } finally {

      setLoadingStock(false);
      setLoadingMovements(false);
      setRefreshing(false);

    }
  };


  // =======================================================
  // LOAD WHEN OPENED
  // =======================================================

  useEffect(() => {

    if (
      isOpen &&
      location?.id
    ) {

      loadLocationData();

    }

  }, [
    isOpen,
    location?.id
  ]);


  // =======================================================
  // SUMMARY
  // =======================================================

  const stockSummary = useMemo(() => {

    let available = 0;
    let reserved = 0;

    stock.forEach((item) => {

      available +=
        Number(
          item.available_quantity ?? 0
        );

      reserved +=
        Number(
          item.reserved_quantity ?? 0
        );

    });

    return {
      items: stock.length,
      available,
      reserved
    };

  }, [stock]);


  // =======================================================
  // OPEN SOURCE RECORD
  // =======================================================

  const handleMovementClick = (
    movement
  ) => {

    const referenceType =
      String(
        movement.reference_type || ""
      ).toUpperCase();


    const referenceId =
      movement.reference_id;


    if (!referenceId) {
      return;
    }


    // -----------------------------------------------------
    // Purchase
    // -----------------------------------------------------

    if (
      referenceType === "PURCHASE"
    ) {

      if (onOpenPurchase) {

        onOpenPurchase(
          referenceId
        );

      }

      return;
    }


    // -----------------------------------------------------
    // Transfer
    // -----------------------------------------------------

    if (
      referenceType === "TRANSFER"
    ) {

      if (onOpenTransfer) {

        onOpenTransfer(
          referenceId
        );

      }

      return;
    }

  };


  // =======================================================
  // CLOSED STATE
  // =======================================================

  if (
    !isOpen ||
    !location
  ) {

    return null;

  }


  const active =
    Boolean(location.is_active);


  // =======================================================
  // RENDER
  // =======================================================

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

          onClose();

        }

      }}
    >

      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-6xl
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
              <MapPin size={20} />
            </div>


            <div>

              <div className="flex items-center gap-2">

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-slate-900
                  "
                >
                  {location.name}
                </h2>


                {active ? (

                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-full
                      bg-emerald-50
                      px-2
                      py-1
                      text-[10px]
                      font-semibold
                      text-emerald-600
                    "
                  >
                    <CheckCircle2 size={11} />
                    ACTIVE
                  </span>

                ) : (

                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-full
                      bg-slate-100
                      px-2
                      py-1
                      text-[10px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    <XCircle size={11} />
                    INACTIVE
                  </span>

                )}

              </div>


              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                "
              >
                {location.description ||
                  "Inventory location"}
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                loadLocationData(true)
              }
              disabled={refreshing}
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

          {/* ERROR */}

          {error && (

            <div
              className="
                mb-5
                rounded-xl
                border
                border-red-100
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>

          )}


          {/* =================================================
              LOCATION SUMMARY
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-3
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

              <div className="flex items-center gap-2">

                <MapPin
                  size={16}
                  className="text-violet-500"
                />

                <p
                  className="
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Location
                </p>

              </div>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >
                {location.name}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                Location #{location.id}
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

              <div className="flex items-center gap-2">

                <Package
                  size={16}
                  className="text-blue-500"
                />

                <p
                  className="
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Stock Items
                </p>

              </div>

              <p
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-slate-900
                "
              >
                {stockSummary.items}
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

              <div className="flex items-center gap-2">

                <Truck
                  size={16}
                  className="text-emerald-500"
                />

                <p
                  className="
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Reserved Stock
                </p>

              </div>

              <p
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-slate-900
                "
              >
                {formatQuantity(
                  stockSummary.reserved
                )}
              </p>

            </div>

          </div>


          {/* =================================================
              CURRENT STOCK
          ================================================= */}

          <div className="mt-6">

            <div className="mb-3">

              <h3
                className="
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >
                Current Stock
              </h3>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-400
                "
              >
                All inventory currently stored at this location.
              </p>

            </div>


            {loadingStock ? (

              <div
                className="
                  flex
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-100
                  py-10
                "
              >
                <Loader2
                  size={20}
                  className="
                    animate-spin
                    text-violet-500
                  "
                />
              </div>

            ) : stock.length === 0 ? (

              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-slate-200
                  px-5
                  py-10
                  text-center
                "
              >

                <Package
                  size={25}
                  className="
                    mx-auto
                    text-slate-300
                  "
                />

                <p
                  className="
                    mt-3
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  No stock in this location
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Inventory will appear here when stock is received or transferred in.
                </p>

              </div>

            ) : (

              <div
                className="
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

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Ingredient
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Current
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Reserved
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Available
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {stock.map((item) => (

                        <tr
                          key={item.id}
                          className="
                            border-b
                            border-slate-50
                            last:border-0
                          "
                        >

                          <td className="px-4 py-3">

                            <p
                              className="
                                text-sm
                                font-semibold
                                text-slate-700
                              "
                            >
                              {item.ingredient}
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {item.sku
                                ? `SKU: ${item.sku}`
                                : "No SKU"}
                            </p>

                          </td>


                          <td className="px-4 py-3 text-right">

                            <span
                              className="
                                text-sm
                                font-semibold
                                text-slate-700
                              "
                            >
                              {formatQuantity(
                                item.current_quantity
                              )}
                            </span>

                            <span
                              className="
                                ml-1
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {item.unit}
                            </span>

                          </td>


                          <td className="px-4 py-3 text-right">

                            <span
                              className="
                                text-sm
                                font-medium
                                text-amber-600
                              "
                            >
                              {formatQuantity(
                                item.reserved_quantity
                              )}
                            </span>

                            <span
                              className="
                                ml-1
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {item.unit}
                            </span>

                          </td>


                          <td className="px-4 py-3 text-right">

                            <span
                              className="
                                text-sm
                                font-semibold
                                text-emerald-600
                              "
                            >
                              {formatQuantity(
                                item.available_quantity
                              )}
                            </span>

                            <span
                              className="
                                ml-1
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {item.unit}
                            </span>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </div>


          {/* =================================================
              STOCK ACTIVITY
          ================================================= */}

          <div className="mt-7">

            <div className="mb-3">

              <h3
                className="
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >
                Stock Activity
              </h3>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-400
                "
              >
                Audit history for stock movements at this location.
              </p>

            </div>


            {loadingMovements ? (

              <div
                className="
                  flex
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-100
                  py-10
                "
              >

                <Loader2
                  size={20}
                  className="
                    animate-spin
                    text-violet-500
                  "
                />

              </div>

            ) : movements.length === 0 ? (

              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-slate-200
                  px-5
                  py-10
                  text-center
                "
              >

                <RefreshCw
                  size={24}
                  className="
                    mx-auto
                    text-slate-300
                  "
                />

                <p
                  className="
                    mt-3
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  No stock activity
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Stock movements for this location will appear here.
                </p>

              </div>

            ) : (

              <div
                className="
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

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Date
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Ingredient
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Movement
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Qty
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Before
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          After
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Reason
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          User
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {movements.map((movement) => {

                        const MovementIcon =
                          getMovementIcon(
                            movement
                          );

                        const referenceType =
                          String(
                            movement.reference_type ||
                            ""
                          ).toUpperCase();

                        const clickable =
                          (
                            referenceType ===
                              "PURCHASE" ||
                            referenceType ===
                              "TRANSFER"
                          ) &&
                          Boolean(
                            movement.reference_id
                          );


                        return (

                          <tr
                            key={movement.id}
                            className="
                              border-b
                              border-slate-50
                              last:border-0
                              hover:bg-slate-50/70
                            "
                          >

                            {/* DATE */}

                            <td className="whitespace-nowrap px-4 py-4">

                              <span
                                className="
                                  text-xs
                                  text-slate-500
                                "
                              >
                                {formatDate(
                                  movement.created_at
                                )}
                              </span>

                            </td>


                            {/* INGREDIENT */}

                            <td className="px-4 py-4">

                              <div>

                                <p
                                  className="
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                  "
                                >
                                  {movement.ingredient}
                                </p>

                                <p
                                  className="
                                    mt-0.5
                                    text-[10px]
                                    text-slate-400
                                  "
                                >
                                  {movement.unit}
                                </p>

                              </div>

                            </td>


                            {/* MOVEMENT */}

                            <td className="min-w-[240px] px-4 py-4">

                              {clickable ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMovementClick(
                                      movement
                                    )
                                  }
                                  className="
                                    group
                                    text-left
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
                                        h-7
                                        w-7
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-violet-50
                                        text-violet-600
                                      "
                                    >
                                      <MovementIcon
                                        size={13}
                                      />
                                    </div>


                                    <div>

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
                                            text-violet-600
                                            group-hover:underline
                                          "
                                        >
                                          {getMovementLabel(
                                            movement
                                          )}
                                        </span>

                                        <ArrowRight
                                          size={11}
                                          className="
                                            text-slate-300
                                          "
                                        />

                                      </div>


                                      <p
                                        className="
                                          mt-0.5
                                          text-xs
                                          font-medium
                                          text-slate-600
                                        "
                                      >
                                        {getMovementDescription(
                                          movement,
                                          location
                                        )}
                                      </p>

                                    </div>

                                  </div>

                                </button>

                              ) : (

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
                                      h-7
                                      w-7
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded-lg
                                      bg-slate-100
                                      text-slate-500
                                    "
                                  >
                                    <MovementIcon
                                      size={13}
                                    />
                                  </div>

                                  <div>

                                    <p
                                      className="
                                        text-xs
                                        font-semibold
                                        text-slate-600
                                      "
                                    >
                                      {getMovementLabel(
                                        movement
                                      )}
                                    </p>

                                    <p
                                      className="
                                        mt-0.5
                                        text-xs
                                        text-slate-500
                                      "
                                    >
                                      {getMovementDescription(
                                        movement,
                                        location
                                      )}
                                    </p>

                                  </div>

                                </div>

                              )}

                            </td>


                            {/* QUANTITY */}

                            <td className="whitespace-nowrap px-4 py-4 text-right">

                              <span
                                className={`
                                  text-sm
                                  font-semibold
                                  ${
                                    Number(
                                      movement.quantity
                                    ) >= 0
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }
                                `}
                              >
                                {Number(
                                  movement.quantity
                                ) >= 0
                                  ? "+"
                                  : ""}
                                {formatQuantity(
                                  movement.quantity
                                )}
                              </span>

                              <span
                                className="
                                  ml-1
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                {movement.unit}
                              </span>

                            </td>


                            {/* BEFORE */}

                            <td className="whitespace-nowrap px-4 py-4 text-right">

                              <span
                                className="
                                  text-xs
                                  font-medium
                                  text-slate-600
                                "
                              >
                                {formatQuantity(
                                  movement.previous_quantity
                                )}
                              </span>

                              <span
                                className="
                                  ml-1
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                {movement.unit}
                              </span>

                            </td>


                            {/* AFTER */}

                            <td className="whitespace-nowrap px-4 py-4 text-right">

                              <span
                                className="
                                  text-xs
                                  font-semibold
                                  text-slate-800
                                "
                              >
                                {formatQuantity(
                                  movement.new_quantity
                                )}
                              </span>

                              <span
                                className="
                                  ml-1
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                {movement.unit}
                              </span>

                            </td>


                            {/* REASON */}

                            <td className="max-w-[220px] px-4 py-4">

                              <p
                                className="
                                  truncate
                                  text-xs
                                  text-slate-500
                                "
                                title={
                                  movement.reason ||
                                  ""
                                }
                              >
                                {movement.reason ||
                                  "—"}
                              </p>

                            </td>


                            {/* USER */}

                            <td className="whitespace-nowrap px-4 py-4">

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
                                    h-7
                                    w-7
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

                          </tr>

                        );

                      })}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </div>


          {/* =================================================
              LOCATION METADATA
          ================================================= */}

          <div
            className="
              mt-6
              grid
              grid-cols-1
              gap-4
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
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Created
              </p>

              <p
                className="
                  mt-1.5
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >
                {formatDate(
                  location.created_at
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
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Last Updated
              </p>

              <p
                className="
                  mt-1.5
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >
                {formatDate(
                  location.updated_at
                )}
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

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
            onClick={onClose}
            className="
              h-10
              rounded-xl
              px-4
              text-sm
              font-semibold
              text-slate-600
              transition
              hover:bg-slate-100
            "
          >
            Close
          </button>


          {canManage && (

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  onToggleStatus(location)
                }
                className={`
                  inline-flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  border
                  px-4
                  text-sm
                  font-semibold
                  transition

                  ${
                    active
                      ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                      : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                  }
                `}
              >

                {active ? (

                  <>
                    <XCircle size={15} />
                    Deactivate
                  </>

                ) : (

                  <>
                    <CheckCircle2 size={15} />
                    Activate
                  </>

                )}

              </button>


              <button
                type="button"
                onClick={() =>
                  onEdit(location)
                }
                className="
                  inline-flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  bg-violet-600
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-violet-700
                "
              >

                <Edit3 size={15} />

                Edit

              </button>

            </div>

          )}

        </div>

      </div>

    </div>

  );

};


export default LocationDetailsModal;