import { useEffect, useMemo, useState } from "react";
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  AlertCircle,
  ClipboardCheck,
} from "lucide-react";

import api from "../services/api";

const PurchaseForm = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  const [supplierId, setSupplierId] = useState("");

  const [items, setItems] = useState([
    {
      ingredientId: "",
      quantity: "",
      unitPrice: "",
    },
  ]);

  const [notes, setNotes] = useState("");

  const [loadingOptions, setLoadingOptions] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

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
          suppliersResponse,
          ingredientsResponse,
        ] = await Promise.all([
          api.get("/suppliers"),
          api.get("/ingredients"),
        ]);

        setSuppliers(
          suppliersResponse.data?.data || []
        );

        setIngredients(
          ingredientsResponse.data?.data || []
        );
      } catch (err) {
        console.error(
          "Failed to load purchase options:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to load suppliers and ingredients."
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
    setSupplierId("");

    setItems([
      {
        ingredientId: "",
        quantity: "",
        unitPrice: "",
      },
    ]);

    setNotes("");
    setError("");
  };

  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  };

  // =========================================================
  // ITEM UPDATE
  // =========================================================

  const updateItem = (
    index,
    field,
    value
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // =========================================================
  // ADD ITEM
  // =========================================================

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        ingredientId: "",
        quantity: "",
        unitPrice: "",
      },
    ]);
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removeItem = (index) => {
    if (items.length === 1) {
      return;
    }

    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  // =========================================================
  // TOTALS
  // =========================================================

  const totalAmount = useMemo(() => {
    return items.reduce(
      (total, item) => {
        const quantity =
          Number(item.quantity || 0);

        const unitPrice =
          Number(item.unitPrice || 0);

        return (
          total +
          quantity * unitPrice
        );
      },
      0
    );
  }, [items]);

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    if (!items.length) {
      setError(
        "Add at least one purchase item."
      );
      return;
    }

    for (const item of items) {
      if (!item.ingredientId) {
        setError(
          "Every purchase item must have an ingredient."
        );
        return;
      }

      if (
        !item.quantity ||
        Number(item.quantity) <= 0
      ) {
        setError(
          "Every item must have a quantity greater than zero."
        );
        return;
      }

      if (
        item.unitPrice === "" ||
        Number(item.unitPrice) < 0
      ) {
        setError(
          "Every item must have a valid unit price."
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      // IMPORTANT:
      // The backend currently accepts:
      // supplierId, items, notes
      //
      // There is intentionally NO receivingLocationId.
      //
      // The purchase remains PENDING until it is
      // approved/completed by the appropriate user.

      const payload = {
        supplierId: Number(supplierId),

        items: items.map((item) => ({
          ingredientId:
            Number(item.ingredientId),

          quantity:
            Number(item.quantity),

          unitPrice:
            Number(item.unitPrice),
        })),

        notes:
          notes.trim() || null,
      };

      await api.post(
        "/purchases",
        payload
      );

      if (onSuccess) {
        await onSuccess();
      }

      resetForm();
      onClose();

    } catch (err) {
      console.error(
        "Failed to create purchase:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to create stock receipt."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  // =========================================================
  // RENDER
  // =========================================================

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
          max-h-[92vh]
          w-full
          max-w-4xl
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
                New Stock Receipt
              </h2>

              <p className="
                mt-0.5
                text-xs
                text-slate-500
              ">
                Record goods received from a supplier.
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


        {/* =====================================================
            BODY
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-6"
        >

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

              <p>{error}</p>
            </div>
          )}


          {/* =================================================
              WORKFLOW INFORMATION
          ================================================= */}

          <div
            className="
              mb-6
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-blue-100
              bg-blue-50/60
              px-4
              py-3.5
            "
          >

            <ClipboardCheck
              size={18}
              className="
                mt-0.5
                shrink-0
                text-blue-600
              "
            />

            <div>

              <p className="
                text-xs
                font-semibold
                text-blue-800
              ">
                Approval required
              </p>

              <p className="
                mt-1
                text-[11px]
                leading-5
                text-blue-700
              ">
                This stock receipt will be submitted
                as pending. A manager or administrator
                must approve it before the stock is
                added to inventory.
              </p>

            </div>

          </div>


          {/* =================================================
              SUPPLIER
          ================================================= */}

          <div>

            <label
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-slate-700
              "
            >
              Supplier
            </label>

            <div className="relative">

              <select
                value={supplierId}
                onChange={(event) =>
                  setSupplierId(
                    event.target.value
                  )
                }
                disabled={
                  loadingOptions ||
                  submitting
                }
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
                    ? "Loading suppliers..."
                    : "Select supplier"}
                </option>

                {suppliers.map(
                  (supplier) => (

                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
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
              ITEMS
          ================================================= */}

          <div className="mt-7">

            <div className="
              flex
              items-center
              justify-between
              gap-4
            ">

              <div>

                <h3 className="
                  text-sm
                  font-semibold
                  text-slate-900
                ">
                  Purchase Items
                </h3>

                <p className="
                  mt-1
                  text-xs
                  text-slate-500
                ">
                  Add each ingredient received from the supplier.
                </p>

              </div>

              <button
                type="button"
                onClick={addItem}
                disabled={submitting}
                className="
                  inline-flex
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-blue-50
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-blue-600
                  transition
                  hover:bg-blue-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Plus size={14} />
                Add item
              </button>

            </div>


            <div className="mt-4 space-y-3">

              {items.map(
                (item, index) => {

                  const ingredient =
                    ingredients.find(
                      (entry) =>
                        String(
                          entry.id
                        ) ===
                        String(
                          item.ingredientId
                        )
                    );

                  const lineTotal =
                    Number(
                      item.quantity || 0
                    ) *
                    Number(
                      item.unitPrice || 0
                    );

                  return (
                    <div
                      key={index}
                      className="
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50/50
                        p-4
                      "
                    >

                      <div
                        className="
                          grid
                          grid-cols-1
                          gap-3
                          md:grid-cols-[1.7fr_1fr_1fr_auto]
                        "
                      >

                        {/* INGREDIENT */}

                        <div>

                          <label className="
                            mb-1.5
                            block
                            text-[11px]
                            font-semibold
                            text-slate-500
                          ">
                            Ingredient
                          </label>

                          <div className="relative">

                            <select
                              value={
                                item.ingredientId
                              }
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "ingredientId",
                                  event.target.value
                                )
                              }
                              disabled={
                                submitting ||
                                loadingOptions
                              }
                              className="
                                h-10
                                w-full
                                appearance-none
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                px-3
                                pr-8
                                text-xs
                                text-slate-700
                                outline-none
                                focus:border-blue-300
                                focus:ring-4
                                focus:ring-blue-500/10
                              "
                            >

                              <option value="">
                                Select ingredient
                              </option>

                              {ingredients.map(
                                (
                                  ingredientOption
                                ) => (

                                  <option
                                    key={
                                      ingredientOption.id
                                    }
                                    value={
                                      ingredientOption.id
                                    }
                                  >
                                    {
                                      ingredientOption.name
                                    }

                                    {ingredientOption.sku
                                      ? ` · ${ingredientOption.sku}`
                                      : ""}
                                  </option>

                                )
                              )}

                            </select>

                            <ChevronDown
                              size={14}
                              className="
                                pointer-events-none
                                absolute
                                right-2.5
                                top-1/2
                                -translate-y-1/2
                                text-slate-400
                              "
                            />

                          </div>

                        </div>


                        {/* QUANTITY */}

                        <div>

                          <label className="
                            mb-1.5
                            block
                            text-[11px]
                            font-semibold
                            text-slate-500
                          ">
                            Quantity
                          </label>

                          <div className="relative">

                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={
                                item.quantity
                              }
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  event.target.value
                                )
                              }
                              disabled={
                                submitting
                              }
                              placeholder="0"
                              className="
                                h-10
                                w-full
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                px-3
                                pr-12
                                text-xs
                                text-slate-700
                                outline-none
                                focus:border-blue-300
                                focus:ring-4
                                focus:ring-blue-500/10
                              "
                            />

                            {ingredient?.unit && (

                              <span
                                className="
                                  pointer-events-none
                                  absolute
                                  right-2.5
                                  top-1/2
                                  -translate-y-1/2
                                  text-[10px]
                                  font-medium
                                  text-slate-400
                                "
                              >
                                {ingredient.unit}
                              </span>

                            )}

                          </div>

                        </div>


                        {/* UNIT PRICE */}

                        <div>

                          <label className="
                            mb-1.5
                            block
                            text-[11px]
                            font-semibold
                            text-slate-500
                          ">
                            Unit Price
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              item.unitPrice
                            }
                            onChange={(event) =>
                              updateItem(
                                index,
                                "unitPrice",
                                event.target.value
                              )
                            }
                            disabled={
                              submitting
                            }
                            placeholder="0.00"
                            className="
                              h-10
                              w-full
                              rounded-lg
                              border
                              border-slate-200
                              bg-white
                              px-3
                              text-xs
                              text-slate-700
                              outline-none
                              focus:border-blue-300
                              focus:ring-4
                              focus:ring-blue-500/10
                            "
                          />

                        </div>


                        {/* REMOVE */}

                        <div className="flex items-end">

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                index
                              )
                            }
                            disabled={
                              submitting ||
                              items.length === 1
                            }
                            className="
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-slate-200
                              bg-white
                              text-slate-400
                              transition
                              hover:border-red-200
                              hover:bg-red-50
                              hover:text-red-500
                              disabled:cursor-not-allowed
                              disabled:opacity-40
                            "
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>

                      </div>


                      {/* LINE TOTAL */}

                      <div className="
                        mt-3
                        flex
                        justify-end
                      ">

                        <p className="
                          text-xs
                          text-slate-500
                        ">
                          Line total:{" "}

                          <span className="
                            font-semibold
                            text-slate-800
                          ">
                            {formatCurrency(
                              lineTotal
                            )}
                          </span>
                        </p>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>


          {/* =================================================
              NOTES
          ================================================= */}

          <div className="mt-6">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Notes

              <span className="
                ml-1
                font-normal
                text-slate-400
              ">
                (optional)
              </span>
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              disabled={submitting}
              rows={3}
              placeholder="Add notes about this delivery..."
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
                placeholder:text-slate-400
                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-500/10
                disabled:bg-slate-50
              "
            />

          </div>


          {/* =================================================
              TOTAL
          ================================================= */}

          <div
            className="
              mt-6
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-blue-100
              bg-blue-50/60
              px-5
              py-4
            "
          >

            <div>

              <p className="
                text-xs
                font-medium
                text-slate-500
              ">
                Purchase Total
              </p>

              <p className="
                mt-1
                text-[11px]
                text-slate-400
              ">
                This receipt will be submitted as pending
                for approval.
              </p>

            </div>

            <p className="
              text-xl
              font-bold
              text-slate-900
            ">
              {formatCurrency(
                totalAmount
              )}
            </p>

          </div>


          {/* =================================================
              ACTIONS
          ================================================= */}

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
                loadingOptions
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
                  <ShoppingCart size={16} />

                  Submit Receipt
                </>
              )}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default PurchaseForm;