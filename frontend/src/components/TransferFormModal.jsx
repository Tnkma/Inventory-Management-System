import { useEffect, useMemo, useState } from "react";

import {
  X,
  ArrowRight,
  Package,
  Loader2,
  AlertCircle,
  ChevronDown,
  Send,
} from "lucide-react";

import api from "../services/api";


const TransferFormModal = ({
  isOpen,
  onClose,
  onSuccess,
}) => {

  const [ingredients, setIngredients] =
    useState([]);

  const [locations, setLocations] =
    useState([]);

  const [inventory, setInventory] =
    useState([]);


  const [ingredientId, setIngredientId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [reason, setReason] =
    useState("");


  const [loadingOptions, setLoadingOptions] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");


  // =========================================================
  // CURRENT USER
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


  const assignedLocationId =
    user?.assigned_location_id ??
    user?.assignedLocationId ??
    user?.user?.assigned_location_id ??
    user?.user?.assignedLocationId ??
    null;


  // =========================================================
  // LOAD OPTIONS
  // =========================================================

  useEffect(() => {

    if (!isOpen) {
      return;
    }


    const loadOptions = async () => {

      try {

        setLoadingOptions(true);
        setError("");


        const [
          ingredientsResponse,
          locationsResponse,
          inventoryResponse,
        ] = await Promise.all([

          api.get("/ingredients"),

          api.get("/inventory-locations"),

          api.get("/inventory"),

        ]);


        setIngredients(
          ingredientsResponse.data?.data || []
        );


        setLocations(
          locationsResponse.data?.data || []
        );


        setInventory(
          inventoryResponse.data?.data || []
        );


      } catch (err) {

        console.error(
          "Failed to load stock request options:",
          err
        );


        setError(
          err.response?.data?.message ||
          "Unable to load stock request options."
        );

      } finally {

        setLoadingOptions(false);

      }

    };


    loadOptions();

  }, [isOpen]);


  // =========================================================
  // RESET
  // =========================================================

  const resetForm = () => {

    setIngredientId("");

    setQuantity("");

    setReason("");

    setError("");

  };


  const handleClose = () => {

    if (submitting) {
      return;
    }


    resetForm();

    onClose();

  };


  // =========================================================
  // MAIN STORE
  // =========================================================

  const mainStore = useMemo(() => {

    return locations.find(
      (location) =>
        location.location_type === "MAIN_STORE" &&
        location.is_active !== false
    );

  }, [locations]);


  // =========================================================
  // ASSIGNED KITCHEN
  // =========================================================

  const assignedKitchen = useMemo(() => {

    if (!assignedLocationId) {
      return null;
    }


    return locations.find(
      (location) =>
        String(location.id) ===
        String(assignedLocationId) &&
        location.location_type === "KITCHEN" &&
        location.is_active !== false
    );

  }, [
    locations,
    assignedLocationId,
  ]);


  // =========================================================
  // SELECTED INGREDIENT
  // =========================================================

  const selectedIngredient = useMemo(() => {

    return ingredients.find(
      (ingredient) =>
        String(ingredient.id) ===
        String(ingredientId)
    );

  }, [
    ingredients,
    ingredientId,
  ]);


  // =========================================================
  // MAIN STORE INVENTORY
  // =========================================================

  const sourceInventory = useMemo(() => {

    if (
      !ingredientId ||
      !mainStore
    ) {
      return null;
    }


    return inventory.find(
      (item) =>
        String(item.ingredient_id) ===
          String(ingredientId) &&
        String(item.location_id) ===
          String(mainStore.id)
    );

  }, [
    inventory,
    ingredientId,
    mainStore,
  ]);


  // =========================================================
  // STOCK CALCULATIONS
  // =========================================================

  const currentStock = Number(
    sourceInventory?.current_quantity || 0
  );


  const reservedStock = Number(
    sourceInventory?.reserved_quantity || 0
  );


  const availableStock = Math.max(
    currentStock - reservedStock,
    0
  );


  const requestQuantity = Number(
    quantity || 0
  );


  const remainingAvailableStock =
    availableStock - requestQuantity;


  // =========================================================
  // SUBMIT REQUEST
  // =========================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");


    // -------------------------------------------------------
    // Role
    // -------------------------------------------------------

    if (
      role &&
      role !== "KITCHEN_STAFF"
    ) {

      setError(
        "Only kitchen staff can create stock requests."
      );

      return;
    }


    // -------------------------------------------------------
    // Assigned kitchen
    // -------------------------------------------------------

    if (!assignedKitchen) {

      setError(
        "You are not assigned to an active kitchen."
      );

      return;
    }


    // -------------------------------------------------------
    // Main store
    // -------------------------------------------------------

    if (!mainStore) {

      setError(
        "The main store has not been configured."
      );

      return;
    }


    // -------------------------------------------------------
    // Ingredient
    // -------------------------------------------------------

    if (!ingredientId) {

      setError(
        "Please select an ingredient."
      );

      return;
    }


    // -------------------------------------------------------
    // Quantity
    // -------------------------------------------------------

    if (
      !quantity ||
      requestQuantity <= 0
    ) {

      setError(
        "Request quantity must be greater than zero."
      );

      return;
    }


    // -------------------------------------------------------
    // Available stock
    // -------------------------------------------------------

    if (
      requestQuantity >
      availableStock
    ) {

      setError(
        `Insufficient available stock. Only ${availableStock} ${
          selectedIngredient?.unit || ""
        } is currently available in the main store.`
      );

      return;
    }


    try {

      setSubmitting(true);


      // -----------------------------------------------------
      // IMPORTANT
      //
      // We intentionally do NOT send:
      //
      // fromLocationId
      // toLocationId
      //
      // The backend determines:
      //
      // FROM = MAIN_STORE
      // TO   = user's assigned kitchen
      // -----------------------------------------------------

      await api.post(
        "/transfers",
        {
          ingredientId:
            Number(ingredientId),

          quantity:
            requestQuantity,

          reason:
            reason.trim() || null,
        }
      );


      if (onSuccess) {

        await onSuccess();

      }


      resetForm();


    } catch (err) {

      console.error(
        "Failed to create stock request:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to submit stock request."
      );


    } finally {

      setSubmitting(false);

    }

  };


  // =========================================================
  // CLOSED
  // =========================================================

  if (!isOpen) {
    return null;
  }


  // =========================================================
  // RENDER
  // =========================================================

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
          flex max-h-[92vh]
          w-full max-w-2xl
          flex-col overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white
          shadow-2xl
        "
      >

        {/* =================================================
            HEADER
        ================================================== */}

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
                rounded-xl
                bg-blue-50
                text-blue-600
              "
            >

              <Send size={19} />

            </div>


            <div>

              <h2
                className="
                  text-base
                  font-semibold
                  text-slate-900
                "
              >
                Request Stock
              </h2>


              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                "
              >
                Request stock from the main store.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-lg
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            <X size={18} />

          </button>

        </div>


        {/* =================================================
            BODY
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="
            overflow-y-auto
            px-6 py-6
          "
        >

          {/* ERROR */}

          {error && (

            <div
              className="
                mb-5
                flex items-start gap-3
                rounded-xl
                border border-red-100
                bg-red-50
                px-4 py-3
                text-sm text-red-700
              "
            >

              <AlertCircle
                size={17}
                className="
                  mt-0.5
                  shrink-0
                "
              />

              <p>
                {error}
              </p>

            </div>

          )}


          {/* =================================================
              REQUEST ROUTE
          ================================================== */}

          <div
            className="
              rounded-2xl
              border border-slate-200
              bg-slate-50/70
              p-5
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
              Stock Request Route
            </p>


            <div
              className="
                mt-4
                grid
                grid-cols-1
                items-center
                gap-3
                sm:grid-cols-[1fr_auto_1fr]
              "
            >

              {/* MAIN STORE */}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
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
                  From
                </p>


                <p
                  className="
                    mt-1.5
                    text-sm
                    font-bold
                    text-slate-800
                  "
                >
                  {mainStore?.name ||
                    "Main Store"}
                </p>


                <p
                  className="
                    mt-1
                    text-[11px]
                    text-slate-400
                  "
                >
                  Main stock receiving store
                </p>

              </div>


              {/* ARROW */}

              <div
                className="
                  flex
                  justify-center
                  text-blue-500
                "
              >

                <div
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-full
                    bg-blue-50
                  "
                >

                  <ArrowRight
                    size={17}
                  />

                </div>

              </div>


              {/* ASSIGNED KITCHEN */}

              <div
                className="
                  rounded-xl
                  border
                  border-emerald-100
                  bg-emerald-50/60
                  p-4
                "
              >

                <p
                  className="
                    text-[10px]
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
                    mt-1.5
                    text-sm
                    font-bold
                    text-slate-800
                  "
                >
                  {assignedKitchen?.name ||
                    "Assigned Kitchen"}
                </p>


                <p
                  className="
                    mt-1
                    text-[11px]
                    text-slate-400
                  "
                >
                  Your assigned kitchen
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              INGREDIENT
          ================================================== */}

          <div className="mt-5">

            <label
              className="
                mb-2 block
                text-xs
                font-semibold
                text-slate-700
              "
            >
              Ingredient
            </label>


            <div className="relative">

              <select
                value={ingredientId}
                onChange={(event) => {

                  setIngredientId(
                    event.target.value
                  );

                  setQuantity("");

                  setError("");

                }}
                disabled={
                  loadingOptions ||
                  submitting
                }
                className="
                  h-11
                  w-full
                  appearance-none
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-3.5 pr-10
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-500/10
                  disabled:cursor-not-allowed
                  disabled:bg-slate-50
                "
              >

                <option value="">

                  {loadingOptions
                    ? "Loading ingredients..."
                    : "Select ingredient"}

                </option>


                {ingredients
                  .filter(
                    (ingredient) =>
                      ingredient.is_active !==
                      false
                  )
                  .map(
                    (ingredient) => (

                      <option
                        key={ingredient.id}
                        value={ingredient.id}
                      >

                        {ingredient.name}

                        {ingredient.sku
                          ? ` · ${ingredient.sku}`
                          : ""}

                      </option>

                    )
                  )}

              </select>


              <ChevronDown
                size={16}
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


          {/* =================================================
              AVAILABLE STOCK
          ================================================== */}

          {ingredientId && (

            <div
              className="
                mt-5
                rounded-xl
                border border-slate-100
                bg-slate-50
                px-4 py-3
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Available in Main Store
                  </p>


                  <p
                    className="
                      mt-1
                      text-lg
                      font-bold
                      text-slate-900
                    "
                  >

                    {availableStock.toLocaleString()}

                    <span
                      className="
                        ml-1
                        text-xs
                        font-medium
                        text-slate-400
                      "
                    >
                      {selectedIngredient?.unit ||
                        ""}
                    </span>

                  </p>

                </div>


                <Package
                  size={20}
                  className="text-slate-300"
                />

              </div>


              {reservedStock > 0 && (

                <p
                  className="
                    mt-2
                    text-[11px]
                    text-amber-600
                  "
                >

                  {reservedStock.toLocaleString()}{" "}

                  {selectedIngredient?.unit ||
                    ""}{" "}

                  is already reserved
                  for approved requests.

                </p>

              )}

            </div>

          )}


          {/* =================================================
              QUANTITY
          ================================================== */}

          <div className="mt-5">

            <label
              className="
                mb-2 block
                text-xs
                font-semibold
                text-slate-700
              "
            >
              Requested Quantity
            </label>


            <div className="relative">

              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(event) => {

                  setQuantity(
                    event.target.value
                  );

                  setError("");

                }}
                disabled={submitting}
                placeholder="0"
                className="
                  h-11
                  w-full
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-3.5 pr-14
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-500/10
                  disabled:cursor-not-allowed
                  disabled:bg-slate-50
                "
              />


              {selectedIngredient?.unit && (

                <span
                  className="
                    pointer-events-none
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  {selectedIngredient.unit}
                </span>

              )}

            </div>

          </div>


          {/* =================================================
              REQUEST PREVIEW
          ================================================== */}

          {ingredientId &&
            requestQuantity > 0 && (

              <div
                className="
                  mt-5
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
                    Requested
                  </p>


                  <p
                    className="
                      mt-1
                      text-lg
                      font-bold
                      text-slate-900
                    "
                  >

                    {requestQuantity.toLocaleString()}

                    <span
                      className="
                        ml-1
                        text-xs
                        font-medium
                        text-slate-400
                      "
                    >
                      {selectedIngredient?.unit ||
                        ""}
                    </span>

                  </p>

                </div>


                <div
                  className={`
                    rounded-xl
                    border
                    p-4
                    ${
                      remainingAvailableStock < 0
                        ? "border-red-100 bg-red-50"
                        : "border-blue-100 bg-blue-50/60"
                    }
                  `}
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
                    Available After Request
                  </p>


                  <p
                    className={`
                      mt-1
                      text-lg
                      font-bold
                      ${
                        remainingAvailableStock < 0
                          ? "text-red-600"
                          : "text-slate-900"
                      }
                    `}
                  >

                    {Math.max(
                      remainingAvailableStock,
                      0
                    ).toLocaleString()}

                    <span
                      className="
                        ml-1
                        text-xs
                        font-medium
                        text-slate-400
                      "
                    >
                      {selectedIngredient?.unit ||
                        ""}
                    </span>

                  </p>

                </div>

              </div>

            )}


          {/* =================================================
              REASON
          ================================================== */}

          <div className="mt-5">

            <label
              className="
                mb-2 block
                text-xs
                font-semibold
                text-slate-700
              "
            >

              Reason

              <span
                className="
                  ml-1
                  font-normal
                  text-slate-400
                "
              >
                (optional)
              </span>

            </label>


            <textarea
              rows={3}
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              disabled={submitting}
              placeholder="
                e.g. Need additional cooking oil
                for dinner service...
              "
              className="
                w-full
                resize-none
                rounded-xl
                border border-slate-200
                bg-white
                px-3.5 py-3
                text-sm
                text-slate-700
                outline-none
                placeholder:text-slate-400
                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-500/10
                disabled:cursor-not-allowed
                disabled:bg-slate-50
              "
            />

          </div>


          {/* =================================================
              INFORMATION
          ================================================== */}

          <div
            className="
              mt-5
              rounded-xl
              border
              border-blue-100
              bg-blue-50/60
              px-4 py-3
            "
          >

            <p
              className="
                text-xs
                font-semibold
                text-blue-800
              "
            >
              What happens next?
            </p>


            <p
              className="
                mt-1
                text-[11px]
                leading-5
                text-blue-700
              "
            >
              Your request will be sent for approval.
              Stock is only reserved after a manager
              or admin approves the request. The store
              keeper will then fulfill the approved request.
            </p>

          </div>


          {/* =================================================
              ACTIONS
          ================================================== */}

          <div
            className="
              mt-6
              flex
              items-center
              justify-end
              gap-3
              border-t
              border-slate-100
              pt-5
            "
          >

            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="
                h-10
                rounded-xl
                px-4
                text-sm
                font-semibold
                text-slate-600
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                submitting ||
                loadingOptions ||
                !ingredientId ||
                !quantity ||
                !mainStore ||
                !assignedKitchen
              }
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
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {submitting ? (

                <>

                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Submitting...

                </>

              ) : (

                <>

                  <Send size={16} />

                  Submit Request

                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

};


export default TransferFormModal;