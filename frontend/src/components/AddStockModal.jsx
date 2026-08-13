import { useEffect, useState } from "react";
import {
  X,
  PackagePlus,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import api from "../services/api";


const AddStockModal = ({ isOpen, onClose, onSuccess }) => {

  const [ingredients, setIngredients] = useState([]);
  const [locations, setLocations] = useState([]);

  const [ingredientId, setIngredientId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [movementType, setMovementType] = useState("PURCHASE");
  const [reason, setReason] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // ==========================================================
  // LOAD INGREDIENTS + LOCATIONS
  // ==========================================================

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
        ] = await Promise.all([
          api.get("/ingredients"),
          api.get("/inventory-locations"),
        ]);


        setIngredients(
          ingredientsResponse.data?.data || []
        );

        setLocations(
          locationsResponse.data?.data || []
        );

      } catch (err) {

        console.error(
          "Failed to load stock options:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to load ingredients and locations."
        );

      } finally {

        setLoadingOptions(false);

      }

    };


    loadOptions();

  }, [isOpen]);


  // ==========================================================
  // RESET
  // ==========================================================

  const resetForm = () => {

    setIngredientId("");
    setLocationId("");
    setQuantity("");
    setMovementType("PURCHASE");
    setReason("");

    setError("");
    setSuccess("");

  };


  // ==========================================================
  // CLOSE
  // ==========================================================

  const handleClose = () => {

    if (submitting) {
      return;
    }

    resetForm();
    onClose();

  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (!ingredientId) {

      setError("Please select an ingredient.");
      return;

    }


    if (!locationId) {

      setError("Please select a location.");
      return;

    }


    const numericQuantity =
      Number(quantity);


    if (
      !quantity ||
      Number.isNaN(numericQuantity) ||
      numericQuantity <= 0
    ) {

      setError(
        "Quantity must be greater than zero."
      );

      return;

    }


    try {

      setSubmitting(true);


      const response = await api.patch(
        `/inventory/${ingredientId}/stock`,
        {
          locationId: Number(locationId),
          quantity: numericQuantity,
          movementType,
          reason: reason.trim() || null,
        }
      );


      console.log(
        "Stock updated:",
        response.data
      );


      setSuccess(
        "Stock added successfully."
      );


      if (onSuccess) {
        await onSuccess();
      }


      setTimeout(() => {

        resetForm();
        onClose();

      }, 700);

    } catch (err) {

      console.error(
        "Failed to add stock:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to update stock."
      );

    } finally {

      setSubmitting(false);

    }

  };


  if (!isOpen) {
    return null;
  }


  // ==========================================================
  // SELECTED INGREDIENT
  // ==========================================================

  const selectedIngredient =
    ingredients.find(
      (ingredient) =>
        String(ingredient.id) ===
        String(ingredientId)
    );


  return (

    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-900/30
        p-4
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {

        if (
          event.target === event.currentTarget
        ) {
          handleClose();
        }

      }}
    >

      <div
        className="
          w-full
          max-w-lg
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
          shadow-slate-900/10
        "
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="
          flex
          items-center
          justify-between
          border-b
          border-slate-100
          px-6
          py-5
        ">

          <div className="
            flex
            items-center
            gap-3
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
              <PackagePlus size={19} />
            </div>


            <div>

              <h2 className="
                text-base
                font-semibold
                text-slate-900
              ">
                Add stock
              </h2>

              <p className="
                mt-0.5
                text-xs
                text-slate-500
              ">
                Record incoming inventory stock.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
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


        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="px-6 py-6"
        >

          {/* Error */}

          {error && (

            <div className="
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
            ">

              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <p>
                {error}
              </p>

            </div>

          )}


          {/* Success */}

          {success && (

            <div className="
              mb-5
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-emerald-100
              bg-emerald-50
              px-4
              py-3
              text-sm
              text-emerald-700
            ">

              <CheckCircle2 size={17} />

              <p>
                {success}
              </p>

            </div>

          )}


          {/* =================================================
              INGREDIENT
          ================================================= */}

          <div>

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Ingredient
            </label>


            <div className="relative">

              <select
                value={ingredientId}
                onChange={(event) =>
                  setIngredientId(
                    event.target.value
                  )
                }
                disabled={loadingOptions || submitting}
                className="
                  h-11
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  pr-10
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-500/10
                  disabled:bg-slate-50
                  disabled:text-slate-400
                "
              >

                <option value="">
                  {loadingOptions
                    ? "Loading ingredients..."
                    : "Select ingredient"}
                </option>

                {ingredients.map(
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
              LOCATION
          ================================================= */}

          <div className="mt-5">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Location
            </label>


            <div className="relative">

              <select
                value={locationId}
                onChange={(event) =>
                  setLocationId(
                    event.target.value
                  )
                }
                disabled={loadingOptions || submitting}
                className="
                  h-11
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  pr-10
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-500/10
                  disabled:bg-slate-50
                  disabled:text-slate-400
                "
              >

                <option value="">
                  {loadingOptions
                    ? "Loading locations..."
                    : "Select location"}
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
              QUANTITY + UNIT
          ================================================= */}

          <div className="mt-5">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Quantity
            </label>


            <div className="relative">

              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value
                  )
                }
                disabled={submitting}
                placeholder="Enter quantity"
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  pr-20
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-500/10
                  disabled:bg-slate-50
                "
              />


              {selectedIngredient?.unit && (

                <span className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-xs
                  font-medium
                  text-slate-400
                ">
                  {selectedIngredient.unit}
                </span>

              )}

            </div>

          </div>


          {/* =================================================
              MOVEMENT TYPE
          ================================================= */}

          <div className="mt-5">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Stock source
            </label>


            <div className="relative">

              <select
                value={movementType}
                onChange={(event) =>
                  setMovementType(
                    event.target.value
                  )
                }
                disabled={submitting}
                className="
                  h-11
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  pr-10
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              >

                <option value="PURCHASE">
                  Purchase
                </option>

                <option value="RETURN">
                  Return
                </option>

                <option value="ADJUSTMENT">
                  Adjustment
                </option>

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
              REASON
          ================================================= */}

          <div className="mt-5">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Reason
              <span className="
                ml-1
                font-normal
                text-slate-400
              ">
                (optional)
              </span>
            </label>


            <textarea
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              disabled={submitting}
              rows={3}
              placeholder="Add a note about this stock update..."
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3.5
                py-3
                text-sm
                text-slate-700
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-500/10
                disabled:bg-slate-50
              "
            />

          </div>


          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="
            mt-6
            flex
            items-center
            justify-end
            gap-3
            border-t
            border-slate-100
            pt-5
          ">

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
                transition
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
                loadingOptions
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                shadow-blue-600/20
                transition
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

                  Adding...
                </>
              ) : (
                <>
                  <PackagePlus size={16} />

                  Add stock
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  );
};


export default AddStockModal;