import { useEffect, useMemo, useState } from "react";
import {
  X,
  ArrowRight,
  Package,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowDownToLine,
} from "lucide-react";

import api from "../services/api";

const TransferFormModal = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [ingredients, setIngredients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [ingredientId, setIngredientId] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD OPTIONS
  // =========================================================

  useEffect(() => {
    if (!isOpen) return;

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
          "Failed to load transfer options:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load transfer options."
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
    setFromLocationId("");
    setToLocationId("");
    setQuantity("");
    setReason("");
    setError("");
  };

  const handleClose = () => {
    if (submitting) return;

    resetForm();
    onClose();
  };

  // =========================================================
  // SELECTED INGREDIENT
  // =========================================================

  const selectedIngredient = useMemo(() => {
    return ingredients.find(
      (ingredient) =>
        String(ingredient.id) ===
        String(ingredientId)
    );
  }, [ingredients, ingredientId]);

  // =========================================================
  // SOURCE INVENTORY
  // =========================================================

  const sourceInventory = useMemo(() => {
    if (!ingredientId || !fromLocationId) {
      return null;
    }

    return inventory.find(
      (item) =>
        String(item.ingredient_id) ===
          String(ingredientId) &&
        String(item.location_id) ===
          String(fromLocationId)
    );
  }, [
    inventory,
    ingredientId,
    fromLocationId,
  ]);

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

  const transferQuantity = Number(
    quantity || 0
  );

  const remainingStock =
    availableStock - transferQuantity;

  // =========================================================
  // DESTINATION
  // =========================================================

  const destinationInventory = useMemo(() => {
    if (!ingredientId || !toLocationId) {
      return null;
    }

    return inventory.find(
      (item) =>
        String(item.ingredient_id) ===
          String(ingredientId) &&
        String(item.location_id) ===
          String(toLocationId)
    );
  }, [
    inventory,
    ingredientId,
    toLocationId,
  ]);

  const destinationCurrentStock = Number(
    destinationInventory?.current_quantity || 0
  );

  const destinationAfterTransfer =
    destinationCurrentStock +
    transferQuantity;

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!ingredientId) {
      setError("Please select an ingredient.");
      return;
    }

    if (!fromLocationId) {
      setError("Please select the source location.");
      return;
    }

    if (!toLocationId) {
      setError(
        "Please select the destination location."
      );
      return;
    }

    if (
      Number(fromLocationId) ===
      Number(toLocationId)
    ) {
      setError(
        "Source and destination locations must be different."
      );
      return;
    }

    if (
      !quantity ||
      transferQuantity <= 0
    ) {
      setError(
        "Transfer quantity must be greater than zero."
      );
      return;
    }

    if (transferQuantity > availableStock) {
      setError(
        `Insufficient available stock. Only ${availableStock} ${
          selectedIngredient?.unit || ""
        } is available.`
      );
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/transfers", {
        ingredientId: Number(ingredientId),
        fromLocationId: Number(fromLocationId),
        toLocationId: Number(toLocationId),
        quantity: transferQuantity,
        reason: reason.trim() || null,
      });

      if (onSuccess) {
        await onSuccess();
      }

      resetForm();
    } catch (err) {
      console.error(
        "Failed to create transfer:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to complete stock transfer."
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
          flex max-h-[92vh] w-full max-w-2xl
          flex-col overflow-hidden
          rounded-2xl border border-slate-200
          bg-white shadow-2xl
        "
      >
        {/* HEADER */}

        <div
          className="
            flex shrink-0 items-center
            justify-between
            border-b border-slate-100
            px-6 py-5
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-10 w-10 items-center
                justify-center rounded-xl
                bg-blue-50 text-blue-600
              "
            >
              <ArrowDownToLine size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                New Stock Transfer
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Move stock from one location to another.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="
              flex h-8 w-8 items-center
              justify-center rounded-lg
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-6"
        >
          {error && (
            <div
              className="
                mb-5 flex items-start gap-3
                rounded-xl border border-red-100
                bg-red-50 px-4 py-3
                text-sm text-red-700
              "
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <p>{error}</p>
            </div>
          )}

          {/* INGREDIENT */}

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                  h-11 w-full appearance-none
                  rounded-xl border border-slate-200
                  bg-white px-3.5 pr-10
                  text-sm text-slate-700
                  outline-none
                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-500/10
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
                  .map((ingredient) => (
                    <option
                      key={ingredient.id}
                      value={ingredient.id}
                    >
                      {ingredient.name}
                      {ingredient.sku
                        ? ` · ${ingredient.sku}`
                        : ""}
                    </option>
                  ))}
              </select>

              <ChevronDown
                size={16}
                className="
                  pointer-events-none
                  absolute right-3 top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />
            </div>
          </div>

          {/* LOCATIONS */}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* FROM */}

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                From Location
              </label>

              <div className="relative">
                <select
                  value={fromLocationId}
                  onChange={(event) => {
                    setFromLocationId(
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
                    h-11 w-full appearance-none
                    rounded-xl border border-slate-200
                    bg-white px-3.5 pr-10
                    text-sm text-slate-700
                    outline-none
                    focus:border-blue-300
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                >
                  <option value="">
                    Select source
                  </option>

                  {locations
                    .filter(
                      (location) =>
                        location.is_active !==
                        false
                    )
                    .map((location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.name}
                      </option>
                    ))}
                </select>

                <ChevronDown
                  size={16}
                  className="
                    pointer-events-none
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />
              </div>
            </div>

            {/* TO */}

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                To Location
              </label>

              <div className="relative">
                <select
                  value={toLocationId}
                  onChange={(event) => {
                    setToLocationId(
                      event.target.value
                    );
                    setError("");
                  }}
                  disabled={
                    loadingOptions ||
                    submitting
                  }
                  className="
                    h-11 w-full appearance-none
                    rounded-xl border border-slate-200
                    bg-white px-3.5 pr-10
                    text-sm text-slate-700
                    outline-none
                    focus:border-blue-300
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                >
                  <option value="">
                    Select destination
                  </option>

                  {locations
                    .filter(
                      (location) =>
                        location.is_active !==
                          false &&
                        String(location.id) !==
                          String(fromLocationId)
                    )
                    .map((location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.name}
                      </option>
                    ))}
                </select>

                <ChevronDown
                  size={16}
                  className="
                    pointer-events-none
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />
              </div>
            </div>
          </div>

          {/* AVAILABLE STOCK */}

          {ingredientId && fromLocationId && (
            <div
              className="
                mt-5 rounded-xl
                border border-slate-100
                bg-slate-50 px-4 py-3
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Available at source
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {availableStock.toLocaleString()}{" "}
                    <span className="text-xs font-medium text-slate-400">
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
                <p className="mt-2 text-[11px] text-amber-600">
                  {reservedStock.toLocaleString()}{" "}
                  {selectedIngredient?.unit || ""}{" "}
                  is currently reserved.
                </p>
              )}
            </div>
          )}

          {/* QUANTITY */}

          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              Transfer Quantity
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
                  h-11 w-full rounded-xl
                  border border-slate-200
                  bg-white px-3.5 pr-14
                  text-sm text-slate-700
                  outline-none
                  focus:border-blue-300
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />

              {selectedIngredient?.unit && (
                <span
                  className="
                    pointer-events-none
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-xs font-medium
                    text-slate-400
                  "
                >
                  {selectedIngredient.unit}
                </span>
              )}
            </div>
          </div>

          {/* TRANSFER PREVIEW */}

          {ingredientId &&
            fromLocationId &&
            toLocationId &&
            transferQuantity > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Source After
                  </p>

                  <p
                    className={`mt-1 text-lg font-bold ${
                      remainingStock < 0
                        ? "text-red-600"
                        : "text-slate-900"
                    }`}
                  >
                    {remainingStock.toLocaleString()}
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      {selectedIngredient?.unit ||
                        ""}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <ArrowRight size={17} />
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                    Destination After
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {destinationAfterTransfer.toLocaleString()}
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      {selectedIngredient?.unit ||
                        ""}
                    </span>
                  </p>
                </div>
              </div>
            )}

          {/* REASON */}

          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              Reason
              <span className="ml-1 font-normal text-slate-400">
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
              placeholder="e.g. Kitchen requested cooking oil..."
              className="
                w-full resize-none
                rounded-xl border border-slate-200
                bg-white px-3.5 py-3
                text-sm text-slate-700
                outline-none
                placeholder:text-slate-400
                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          {/* ACTIONS */}

          <div
            className="
              mt-6 flex items-center
              justify-end gap-3
              border-t border-slate-100
              pt-5
            "
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="
                h-10 rounded-xl px-4
                text-sm font-semibold
                text-slate-600
                hover:bg-slate-100
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingOptions ||
                loadingInventory ||
                !ingredientId ||
                !fromLocationId ||
                !toLocationId ||
                !quantity
              }
              className="
                inline-flex h-10
                items-center gap-2
                rounded-xl bg-blue-600
                px-5 text-sm font-semibold
                text-white shadow-sm
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
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowDownToLine size={16} />
                  Transfer Stock
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