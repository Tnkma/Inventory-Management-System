import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  Plus,
  Pencil,
  Power,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

import api from "../services/api";

const emptyForm = {
  name: "",
  sku: "",
  category_id: "",
  unit: "",
  minimum_stock: "",
  maximum_stock: "",
  reorder_level: "",
  description: "",
};

const Ingredients = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchData = async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const results = await Promise.allSettled([
        api.get("/ingredients"),
        api.get("/categories"),
      ]);

      const ingredientsResult = results[0];
      const categoriesResult = results[1];

      if (ingredientsResult.status === "fulfilled") {
        setIngredients(
          ingredientsResult.value.data?.data || []
        );
      } else {
        throw (
          ingredientsResult.reason ||
          new Error("Unable to load ingredients.")
        );
      }

      if (categoriesResult.status === "fulfilled") {
        setCategories(
          categoriesResult.value.data?.data || []
        );
      } else {
        console.error(
          "Unable to load categories:",
          categoriesResult.reason
        );
      }
    } catch (err) {
      console.error(
        "Ingredients loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load ingredients."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  // =========================================================
  // FILTERED INGREDIENTS
  // =========================================================

  const filteredIngredients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return ingredients.filter((ingredient) => {
      const matchesSearch =
        !term ||
        ingredient.name
          ?.toLowerCase()
          .includes(term) ||
        ingredient.sku
          ?.toLowerCase()
          .includes(term) ||
        ingredient.category
          ?.toLowerCase()
          .includes(term);

      const matchesCategory =
        categoryFilter === "ALL" ||
        String(ingredient.category_id) ===
          String(categoryFilter);

      const active =
        Number(ingredient.is_active) === 1;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    ingredients,
    search,
    categoryFilter,
    statusFilter,
  ]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    const active = ingredients.filter(
      (item) => Number(item.is_active) === 1
    ).length;

    const inactive =
      ingredients.length - active;

    const categoryCount = new Set(
      ingredients
        .map((item) => item.category_id)
        .filter(Boolean)
    ).size;

    return {
      total: ingredients.length,
      active,
      inactive,
      categoryCount,
    };
  }, [ingredients]);

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingIngredient(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (ingredient) => {
    setEditingIngredient(ingredient);

    setForm({
      name: ingredient.name || "",
      sku: ingredient.sku || "",
      category_id:
        ingredient.category_id
          ? String(ingredient.category_id)
          : "",
      unit: ingredient.unit || "",
      minimum_stock:
        ingredient.minimum_stock ?? "",
      maximum_stock:
        ingredient.maximum_stock ?? "",
      reorder_level:
        ingredient.reorder_level ?? "",
      description:
        ingredient.description || "",
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingIngredient(null);
    setForm(emptyForm);
    setFormError("");
  };

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!form.name.trim()) {
      setFormError(
        "Ingredient name is required."
      );
      return;
    }

    if (!form.category_id) {
      setFormError(
        "Please select a category."
      );
      return;
    }

    if (!form.unit.trim()) {
      setFormError("Unit is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        category_id: Number(form.category_id),
        unit: form.unit.trim(),
        minimum_stock:
          form.minimum_stock === ""
            ? 0
            : Number(form.minimum_stock),
        maximum_stock:
          form.maximum_stock === ""
            ? null
            : Number(form.maximum_stock),
        reorder_level:
          form.reorder_level === ""
            ? 0
            : Number(form.reorder_level),
        description:
          form.description.trim() || null,
      };

      if (editingIngredient) {
        await api.patch(
          `/ingredients/${editingIngredient.id}`,
          payload
        );
      } else {
        await api.post(
          "/ingredients",
          payload
        );
      }

      closeModal();

      await fetchData(false);
    } catch (err) {
      console.error(
        "Failed to save ingredient:",
        err
      );

      setFormError(
        err.response?.data?.message ||
          "Unable to save ingredient."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // TOGGLE ACTIVE STATUS
  // =========================================================

  const toggleStatus = async (ingredient) => {
    const isActive =
      Number(ingredient.is_active) === 1;

    const confirmed = window.confirm(
      isActive
        ? `Deactivate ${ingredient.name}?`
        : `Activate ${ingredient.name}?`
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/ingredients/${ingredient.id}`,
        {
          is_active: !isActive,
        }
      );

      await fetchData(false);
    } catch (err) {
      console.error(
        "Failed to update ingredient status:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update ingredient status."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-full bg-white">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-blue-50
              text-blue-600
            ">
              <RefreshCw
                size={20}
                className="animate-spin"
              />
            </div>

            <p className="
              mt-4
              text-sm
              font-semibold
              text-slate-700
            ">
              Loading ingredients
            </p>

            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Fetching your ingredient catalogue...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full bg-white text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="
        mb-7
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-end
        sm:justify-between
      ">

        <div>
          <div className="
            flex
            items-center
            gap-2
          ">
            <h1 className="
              text-2xl
              font-bold
              tracking-tight
              text-slate-900
            ">
              Ingredients
            </h1>

            {refreshing && (
              <RefreshCw
                size={15}
                className="
                  animate-spin
                  text-blue-500
                "
              />
            )}
          </div>

          <p className="
            mt-1
            text-sm
            text-slate-500
          ">
            Manage the ingredients your restaurant keeps in stock.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="
            inline-flex
            h-10
            items-center
            justify-center
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
            hover:shadow-md
          "
        >
          <Plus size={17} />
          Add Ingredient
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="
          mb-5
          flex
          items-start
          gap-3
          rounded-2xl
          border
          border-red-100
          bg-red-50
          px-4
          py-3.5
        ">
          <XCircle
            size={18}
            className="
              mt-0.5
              shrink-0
              text-red-500
            "
          />

          <div className="min-w-0">
            <p className="
              text-sm
              font-semibold
              text-red-700
            ">
              Unable to load ingredients
            </p>

            <p className="
              mt-0.5
              text-xs
              text-red-600
            ">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="
        mb-5
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-4
      ">

        <SummaryCard
          icon={Package}
          title="Total Ingredients"
          value={summary.total}
          description="In your catalogue"
          iconClass="bg-blue-50 text-blue-600"
          badge="All"
        />

        <SummaryCard
          icon={CheckCircle2}
          title="Active"
          value={summary.active}
          description="Available for inventory"
          iconClass="bg-emerald-50 text-emerald-600"
          badge="Active"
        />

        <SummaryCard
          icon={XCircle}
          title="Inactive"
          value={summary.inactive}
          description="Currently disabled"
          iconClass="bg-slate-100 text-slate-500"
          badge="Inactive"
        />

        <SummaryCard
          icon={ChevronRight}
          title="Categories"
          value={summary.categoryCount}
          description="Categories represented"
          iconClass="bg-violet-50 text-violet-600"
          badge="Types"
        />

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      ">

        {/* FILTERS */}

        <div className="
          flex
          flex-col
          gap-3
          border-b
          border-slate-100
          p-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        ">

          <div className="
            relative
            w-full
            lg:max-w-md
          ">
            <Search
              size={17}
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search ingredients or SKU..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                pl-10
                pr-4
                text-sm
                outline-none
                transition
                focus:border-blue-300
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          <div className="
            flex
            flex-col
            gap-2
            sm:flex-row
          ">

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="
                h-10
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3
                text-sm
                text-slate-600
                outline-none
                focus:border-blue-300
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10
              "
            >
              <option value="ALL">
                All categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="
                h-10
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3
                text-sm
                text-slate-600
                outline-none
                focus:border-blue-300
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10
              "
            >
              <option value="ALL">
                All status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>

          </div>
        </div>

        {/* EMPTY */}

        {filteredIngredients.length === 0 ? (
          <div className="px-6 py-16 text-center">

            <div className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-slate-100
              text-slate-400
            ">
              <Package size={22} />
            </div>

            <p className="
              mt-4
              text-sm
              font-semibold
              text-slate-800
            ">
              No ingredients found
            </p>

            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Try changing your search or filters.
            </p>

          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="
                  border-b
                  border-slate-100
                  bg-slate-50/70
                ">

                  <TableHeader>
                    Ingredient
                  </TableHeader>

                  <TableHeader>
                    Category
                  </TableHeader>

                  <TableHeader>
                    Unit
                  </TableHeader>

                  <TableHeader>
                    Stock Rules
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader align="right">
                    Actions
                  </TableHeader>

                </tr>
              </thead>

              <tbody>

                {filteredIngredients.map(
                  (ingredient) => {

                    const active =
                      Number(
                        ingredient.is_active
                      ) === 1;

                    return (
                      <tr
                        key={ingredient.id}
                        className="
                          border-b
                          border-slate-50
                          transition
                          hover:bg-slate-50/70
                        "
                      >

                        {/* NAME */}

                        <td className="px-5 py-4">

                          <div>
                            <p className="
                              text-sm
                              font-semibold
                              text-slate-800
                            ">
                              {ingredient.name}
                            </p>

                            {ingredient.sku && (
                              <p className="
                                mt-0.5
                                text-[11px]
                                text-slate-400
                              ">
                                SKU: {ingredient.sku}
                              </p>
                            )}
                          </div>

                        </td>

                        {/* CATEGORY */}

                        <td className="
                          px-5
                          py-4
                          text-sm
                          text-slate-600
                        ">
                          {ingredient.category ||
                            "—"}
                        </td>

                        {/* UNIT */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <span className="
                            rounded-lg
                            bg-slate-100
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            text-slate-600
                          ">
                            {ingredient.unit}
                          </span>
                        </td>

                        {/* STOCK RULES */}

                        <td className="px-5 py-4">

                          <div className="text-xs">

                            <p className="
                              font-medium
                              text-slate-700
                            ">
                              Min:{" "}
                              {Number(
                                ingredient.minimum_stock ??
                                  0
                              ).toLocaleString()}
                            </p>

                            <p className="
                              mt-0.5
                              text-slate-400
                            ">
                              Reorder:{" "}
                              {Number(
                                ingredient.reorder_level ??
                                  0
                              ).toLocaleString()}
                            </p>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          {active ? (
                            <span className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              bg-emerald-50
                              px-2.5
                              py-1
                              text-[11px]
                              font-semibold
                              text-emerald-700
                            ">
                              <span className="
                                h-1.5
                                w-1.5
                                rounded-full
                                bg-emerald-500
                              " />
                              Active
                            </span>
                          ) : (
                            <span className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              bg-slate-100
                              px-2.5
                              py-1
                              text-[11px]
                              font-semibold
                              text-slate-500
                            ">
                              <span className="
                                h-1.5
                                w-1.5
                                rounded-full
                                bg-slate-400
                              " />
                              Inactive
                            </span>
                          )}

                        </td>

                        {/* ACTIONS */}

                        <td className="
                          px-5
                          py-4
                          text-right
                        ">

                          <div className="
                            flex
                            items-center
                            justify-end
                            gap-1
                          ">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  ingredient
                                )
                              }
                              title="Edit ingredient"
                              className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                text-slate-400
                                transition
                                hover:bg-blue-50
                                hover:text-blue-600
                              "
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  ingredient
                                )
                              }
                              title={
                                active
                                  ? "Deactivate"
                                  : "Activate"
                              }
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
                              <Power size={15} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          bg-slate-900/40
          px-4
          backdrop-blur-sm
        ">

          <div className="
            w-full
            max-w-2xl
            overflow-hidden
            rounded-3xl
            bg-white
            shadow-2xl
          ">

            {/* MODAL HEADER */}

            <div className="
              flex
              items-center
              justify-between
              border-b
              border-slate-100
              px-6
              py-5
            ">

              <div>
                <h2 className="
                  text-lg
                  font-bold
                  text-slate-900
                ">
                  {editingIngredient
                    ? "Edit Ingredient"
                    : "Add Ingredient"}
                </h2>

                <p className="
                  mt-1
                  text-xs
                  text-slate-500
                ">
                  {editingIngredient
                    ? "Update the ingredient details."
                    : "Create an ingredient that can later receive stock."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                  text-slate-500
                  transition
                  hover:bg-slate-200
                  hover:text-slate-800
                "
              >
                <X size={17} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {formError && (
                <div className="
                  mb-5
                  rounded-xl
                  border
                  border-red-100
                  bg-red-50
                  px-4
                  py-3
                  text-xs
                  font-medium
                  text-red-600
                ">
                  {formError}
                </div>
              )}

              <div className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              ">

                <FormField
                  label="Ingredient Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Beef"
                  required
                />

                <FormField
                  label="SKU"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="e.g. BEEF-001"
                />

                <div>
                  <label className="
                    mb-1.5
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                  ">
                    Category *
                  </label>

                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    className="
                      h-10
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-3
                      text-sm
                      text-slate-700
                      outline-none
                      transition
                      focus:border-blue-300
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/10
                    "
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <FormField
                  label="Unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder="e.g. kg, litre, piece"
                  required
                />

                <FormField
                  label="Minimum Stock"
                  name="minimum_stock"
                  type="number"
                  value={form.minimum_stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.001"
                />

                <FormField
                  label="Reorder Level"
                  name="reorder_level"
                  type="number"
                  value={form.reorder_level}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.001"
                />

                <FormField
                  label="Maximum Stock"
                  name="maximum_stock"
                  type="number"
                  value={form.maximum_stock}
                  onChange={handleChange}
                  placeholder="Optional"
                  min="0"
                  step="0.001"
                />

                <div className="sm:col-span-2">
                  <label className="
                    mb-1.5
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                  ">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe this ingredient..."
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-3
                      py-2.5
                      text-sm
                      text-slate-700
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-blue-300
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/10
                    "
                  />
                </div>

              </div>

              {/* FOOTER */}

              <div className="
                mt-6
                flex
                items-center
                justify-end
                gap-2
                border-t
                border-slate-100
                pt-5
              ">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="
                    h-10
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    font-semibold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
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
                    shadow-blue-600/20
                    transition
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {saving && (
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {editingIngredient
                    ? "Save Changes"
                    : "Create Ingredient"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

// =========================================================
// SUMMARY CARD
// =========================================================

const SummaryCard = ({
  icon: Icon,
  title,
  value,
  description,
  iconClass,
  badge,
}) => {
  return (
    <div className="
      rounded-2xl
      border
      border-slate-200
      bg-white
      p-5
      shadow-sm
      transition
      hover:-translate-y-0.5
      hover:shadow-md
    ">

      <div className="
        flex
        items-start
        justify-between
      ">

        <div className={`
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          ${iconClass}
        `}>
          <Icon size={19} />
        </div>

        <span className="
          rounded-full
          bg-slate-50
          px-2.5
          py-1
          text-[11px]
          font-semibold
          text-slate-500
        ">
          {badge}
        </span>

      </div>

      <div className="mt-5">

        <p className="
          text-xs
          font-medium
          text-slate-500
        ">
          {title}
        </p>

        <p className="
          mt-1
          text-3xl
          font-bold
          tracking-tight
          text-slate-900
        ">
          {value}
        </p>

        <p className="
          mt-1.5
          text-xs
          text-slate-400
        ">
          {description}
        </p>

      </div>

    </div>
  );
};

// =========================================================
// TABLE HEADER
// =========================================================

const TableHeader = ({
  children,
  align = "left",
}) => {
  return (
    <th
      className={`
        px-5
        py-3.5
        text-${align}
        text-[10px]
        font-semibold
        uppercase
        tracking-wider
        text-slate-400
      `}
    >
      {children}
    </th>
  );
};

// =========================================================
// FORM FIELD
// =========================================================

const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  step,
}) => {
  return (
    <div>
      <label className="
        mb-1.5
        block
        text-xs
        font-semibold
        text-slate-600
      ">
        {label}
        {required && " *"}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        className="
          h-10
          w-full
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-3
          text-sm
          text-slate-700
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-blue-300
          focus:bg-white
          focus:ring-4
          focus:ring-blue-500/10
        "
      />
    </div>
  );
};

export default Ingredients;