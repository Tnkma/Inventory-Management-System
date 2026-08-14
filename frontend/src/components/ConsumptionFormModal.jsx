import { useEffect, useState } from "react";

import {
  AlertCircle,
  PackageMinus,
  RefreshCw,
  X,
} from "lucide-react";

import api from "../services/api";


const ConsumptionFormModal = ({
  isOpen,
  onClose,
  onSuccess,
}) => {

  const [ingredients, setIngredients] =
    useState([]);

  const [loadingIngredients, setLoadingIngredients] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");


  const [formData, setFormData] =
    useState({
      ingredientId: "",
      quantity: "",
      reason: "",
    });


  // =======================================================
  // LOAD INGREDIENTS
  // =======================================================

  const loadIngredients = async () => {

    try {

      setLoadingIngredients(true);
      setError("");


      const response =
        await api.get(
          "/ingredients"
        );


      setIngredients(
        response.data?.data || []
      );

    } catch (err) {

      console.error(
        "Failed to load ingredients:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to load ingredients."
      );

    } finally {

      setLoadingIngredients(false);

    }

  };


  useEffect(() => {

    if (!isOpen) {
      return;
    }


    setFormData({
      ingredientId: "",
      quantity: "",
      reason: "",
    });

    setError("");


    loadIngredients();

  }, [isOpen]);


  // =======================================================
  // CLOSE
  // =======================================================

  const handleClose = () => {

    if (submitting) {
      return;
    }


    setFormData({
      ingredientId: "",
      quantity: "",
      reason: "",
    });

    setError("");


    onClose();

  };


  // =======================================================
  // CHANGE
  // =======================================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =======================================================
  // SUBMIT
  // =======================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    setError("");


    if (!formData.ingredientId) {

      setError(
        "Please select an ingredient."
      );

      return;
    }


    const quantity =
      Number(
        formData.quantity
      );


    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {

      setError(
        "Consumption quantity must be greater than zero."
      );

      return;
    }


    try {

      setSubmitting(true);


      await api.post(
        "/consumption",
        {
          ingredientId:
            Number(
              formData.ingredientId
            ),

          quantity,

          reason:
            formData.reason.trim() ||
            null,
        }
      );


      if (onSuccess) {
        await onSuccess();
      }


      handleClose();

    } catch (err) {

      console.error(
        "Failed to record consumption:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to record consumption."
      );

    } finally {

      setSubmitting(false);

    }

  };


  if (!isOpen) {
    return null;
  }


  return (

    <div
      className="
        fixed
        inset-0
        z-[70]
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

      <div className="
        w-full
        max-w-lg
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-2xl
      ">

        {/* =================================================
            HEADER
        ================================================= */}

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
              bg-amber-50
              text-amber-600
            ">

              <PackageMinus size={19} />

            </div>


            <div>

              <h2 className="
                text-base
                font-semibold
                text-slate-900
              ">
                Record Consumption
              </h2>


              <p className="
                mt-0.5
                text-xs
                text-slate-500
              ">
                Deduct consumed stock from inventory.
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
              disabled:opacity-50
            "
          >

            <X size={18} />

          </button>

        </div>


        {/* =================================================
            BODY
        ================================================= */}

        <form
          onSubmit={handleSubmit}
        >

          <div className="
            space-y-5
            px-6
            py-6
          ">

            {error && (

              <div className="
                flex
                items-start
                gap-2.5
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
                  size={16}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />

                <p>{error}</p>

              </div>

            )}


            {/* INGREDIENT */}

            <div>

              <label
                htmlFor="ingredientId"
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-slate-700
                "
              >
                Ingredient
              </label>


              <select
                id="ingredientId"
                name="ingredientId"
                value={
                  formData.ingredientId
                }
                onChange={handleChange}
                disabled={
                  loadingIngredients ||
                  submitting
                }
                required
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-amber-300
                  focus:ring-4
                  focus:ring-amber-500/10
                  disabled:bg-slate-50
                "
              >

                <option value="">
                  {loadingIngredients
                    ? "Loading ingredients..."
                    : "Select ingredient"}
                </option>


                {ingredients.map(
                  (ingredient) => (

                    <option
                      key={
                        ingredient.id
                      }
                      value={
                        ingredient.id
                      }
                    >
                      {ingredient.name}
                      {ingredient.unit
                        ? ` (${ingredient.unit})`
                        : ""}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* QUANTITY */}

            <div>

              <label
                htmlFor="quantity"
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-slate-700
                "
              >
                Quantity
              </label>


              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                value={
                  formData.quantity
                }
                onChange={handleChange}
                disabled={submitting}
                placeholder="Enter quantity"
                required
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-amber-300
                  focus:ring-4
                  focus:ring-amber-500/10
                  disabled:bg-slate-50
                "
              />

            </div>


            {/* REASON */}

            <div>

              <label
                htmlFor="reason"
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-slate-700
                "
              >
                Reason
                <span className="
                  ml-1
                  font-normal
                  text-slate-400
                ">
                  Optional
                </span>
              </label>


              <textarea
                id="reason"
                name="reason"
                rows={3}
                value={
                  formData.reason
                }
                onChange={handleChange}
                disabled={submitting}
                placeholder="e.g. Prepared lunch service"
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
                  focus:border-amber-300
                  focus:ring-4
                  focus:ring-amber-500/10
                  disabled:bg-slate-50
                "
              />

            </div>


            <div className="
              rounded-xl
              border
              border-amber-100
              bg-amber-50/60
              px-4
              py-3
            ">

              <p className="
                text-xs
                leading-5
                text-amber-700
              ">
                Recording consumption will deduct the quantity from the applicable inventory location and create a stock movement.
              </p>

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="
            flex
            items-center
            justify-end
            gap-2
            border-t
            border-slate-100
            px-6
            py-4
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
                disabled:opacity-50
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                submitting ||
                loadingIngredients
              }
              className="
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                bg-amber-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-amber-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {submitting ? (

                <>
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />

                  Recording...

                </>

              ) : (

                <>
                  <PackageMinus size={15} />

                  Record Consumption

                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

};


export default ConsumptionFormModal;