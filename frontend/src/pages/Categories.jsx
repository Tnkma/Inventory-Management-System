import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import CategoryFormModal from "../components/CategoryFormModal";
import CategoryDetailsModal from "../components/CategoryDetailsModal";


// =========================================================
// HELPERS
// =========================================================

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


const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};


// =========================================================
// PAGE
// =========================================================

const Categories = () => {

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);


  // =======================================================
  // CURRENT USER / ROLE
  // =======================================================

  const currentUser = getCurrentUser();

  const role = String(
    currentUser?.role ||
    currentUser?.roleName ||
    currentUser?.role?.name ||
    ""
  ).toUpperCase();

  const canManage =
    role === "ADMIN" ||
    role === "MANAGER";


  // =======================================================
  // LOAD CATEGORIES
  // =======================================================

  const fetchCategories = async (
    showInitialLoading = true
  ) => {

    try {

      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response =
        await api.get("/categories");

      setCategories(
        response.data?.data || []
      );

    } catch (err) {

      console.error(
        "Failed to load categories:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load categories."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  useEffect(() => {
    fetchCategories(true);
  }, []);


  // =======================================================
  // FILTERED CATEGORIES
  // =======================================================

  const filteredCategories =
    useMemo(() => {

      const searchTerm =
        search.trim().toLowerCase();

      return categories.filter(
        (category) => {

          const matchesSearch =
            !searchTerm ||
            category.name
              ?.toLowerCase()
              .includes(searchTerm) ||
            category.description
              ?.toLowerCase()
              .includes(searchTerm);

          const matchesStatus =
            statusFilter === "ALL" ||
            (
              statusFilter === "ACTIVE" &&
              category.is_active
            ) ||
            (
              statusFilter === "INACTIVE" &&
              !category.is_active
            );

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      categories,
      search,
      statusFilter,
    ]);


  // =======================================================
  // SUMMARY
  // =======================================================

  const summary =
    useMemo(() => {

      const active =
        categories.filter(
          (category) =>
            Boolean(category.is_active)
        ).length;

      const inactive =
        categories.length - active;

      return {
        total: categories.length,
        active,
        inactive,
      };

    }, [categories]);


  // =======================================================
  // OPEN CREATE
  // =======================================================

  const handleCreate = () => {

    setEditingCategory(null);
    setFormOpen(true);

  };


  // =======================================================
  // OPEN EDIT
  // =======================================================

  const handleEdit = (category) => {

    setEditingCategory(category);
    setFormOpen(true);

  };


  // =======================================================
  // VIEW DETAILS
  // =======================================================

  const handleView = (category) => {

    setSelectedCategory(category);
    setDetailsOpen(true);

  };


  // =======================================================
  // FORM SUCCESS
  // =======================================================

  const handleFormSuccess = async () => {

    setFormOpen(false);
    setEditingCategory(null);

    await fetchCategories(false);

  };


  // =======================================================
  // STATUS UPDATE
  // =======================================================

  const handleToggleStatus = async (
    category
  ) => {

    const nextStatus =
      !Boolean(category.is_active);

    const action =
      nextStatus
        ? "activate"
        : "deactivate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} "${category.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await api.patch(
        `/categories/${category.id}/status`,
        {
          isActive: nextStatus,
        }
      );

      await fetchCategories(false);

      // Keep details modal synchronized.
      if (
        selectedCategory &&
        selectedCategory.id === category.id
      ) {

        setSelectedCategory(
          (current) =>
            current
              ? {
                  ...current,
                  is_active: nextStatus,
                }
              : current
        );
      }

    } catch (err) {

      console.error(
        "Failed to update category status:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to update category status."
      );

    }
  };


  // =======================================================
  // CLEAR FILTERS
  // =======================================================

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL";


  const clearFilters = () => {

    setSearch("");
    setStatusFilter("ALL");

  };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (
      <div className="min-h-full bg-white">

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="text-center">

            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-blue-50
                text-blue-600
              "
            >
              <RefreshCw
                size={20}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading categories
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Fetching inventory categories...
            </p>

          </div>

        </div>

      </div>
    );
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      className="
        min-h-full
        bg-white
        text-slate-900
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          mb-7
          flex
          flex-col
          gap-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <div className="flex items-center gap-2">

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-slate-900
              "
            >
              Categories
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

          <p className="mt-1 text-sm text-slate-500">
            Organize ingredients into inventory categories.
          </p>

        </div>


        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              fetchCategories(false)
            }
            disabled={refreshing}
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3.5
              text-sm
              font-medium
              text-slate-600
              shadow-sm
              transition
              hover:border-slate-300
              hover:bg-slate-50
              hover:text-slate-900
              disabled:cursor-not-allowed
              disabled:opacity-60
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

            Refresh
          </button>


          {canManage && (
            <button
              type="button"
              onClick={handleCreate}
              className="
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                bg-blue-600
                px-4
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >
              <Plus size={16} />
              Add Category
            </button>
          )}

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="
            mb-6
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-red-100
            bg-red-50
            px-4
            py-3.5
          "
        >

          <XCircle
            size={18}
            className="
              mt-0.5
              shrink-0
              text-red-500
            "
          />

          <div>

            <p className="text-sm font-semibold text-red-700">
              Category operation failed
            </p>

            <p className="mt-0.5 text-xs text-red-600">
              {error}
            </p>

          </div>

        </div>
      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-3
        "
      >

        {/* TOTAL */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >

          <div className="flex items-start justify-between">

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
              <FolderTree size={19} />
            </div>

            <span
              className="
                rounded-full
                bg-blue-50
                px-2.5
                py-1
                text-[11px]
                font-semibold
                text-blue-600
              "
            >
              All
            </span>

          </div>

          <p className="mt-5 text-xs font-medium text-slate-500">
            Total Categories
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {summary.total}
          </p>

          <p className="mt-1.5 text-xs text-slate-400">
            Inventory classifications
          </p>

        </div>


        {/* ACTIVE */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >

          <div className="flex items-start justify-between">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              "
            >
              <CheckCircle2 size={19} />
            </div>

            <span
              className="
                rounded-full
                bg-emerald-50
                px-2.5
                py-1
                text-[11px]
                font-semibold
                text-emerald-600
              "
            >
              Active
            </span>

          </div>

          <p className="mt-5 text-xs font-medium text-slate-500">
            Active Categories
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {summary.active}
          </p>

          <p className="mt-1.5 text-xs text-slate-400">
            Available for ingredients
          </p>

        </div>


        {/* INACTIVE */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >

          <div className="flex items-start justify-between">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-slate-100
                text-slate-500
              "
            >
              <XCircle size={19} />
            </div>

            <span
              className="
                rounded-full
                bg-slate-100
                px-2.5
                py-1
                text-[11px]
                font-semibold
                text-slate-500
              "
            >
              Inactive
            </span>

          </div>

          <p className="mt-5 text-xs font-medium text-slate-500">
            Inactive Categories
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {summary.inactive}
          </p>

          <p className="mt-1.5 text-xs text-slate-400">
            No longer available for new use
          </p>

        </div>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      <div
        className="
          mt-5
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >

        {/* FILTER BAR */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-slate-100
            p-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          <div className="relative w-full lg:max-w-md">

            <Search
              size={16}
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
              placeholder="Search categories..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                pl-10
                pr-4
                text-sm
                outline-none
                transition
                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-500/10
              "
            />

          </div>


          <div className="flex flex-wrap items-center gap-3">

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
                bg-white
                px-3.5
                text-sm
                font-medium
                text-slate-600
                outline-none
                transition
                focus:border-blue-300
                focus:ring-4
                focus:ring-blue-500/10
              "
            >

              <option value="ALL">
                All statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

            </select>


            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  h-10
                  rounded-xl
                  px-3
                  text-xs
                  font-semibold
                  text-blue-600
                  transition
                  hover:bg-blue-50
                "
              >
                Clear filters
              </button>
            )}

          </div>

        </div>


        {/* EMPTY */}

        {filteredCategories.length === 0 && (
          <div className="p-14 text-center">

            <FolderTree
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No categories found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {hasActiveFilters
                ? "Try changing your search or filters."
                : "Create your first inventory category."}
            </p>

            {!hasActiveFilters &&
              canManage && (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-blue-50
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-blue-600
                    hover:bg-blue-100
                  "
                >
                  <Plus size={14} />
                  Add Category
                </button>
              )}

          </div>
        )}


        {/* TABLE */}

        {filteredCategories.length > 0 && (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr
                  className="
                    border-b
                    border-slate-100
                    bg-slate-50/60
                  "
                >

                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Category
                  </th>

                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </th>

                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Created
                  </th>

                  <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredCategories.map(
                  (category) => {

                    const active =
                      Boolean(
                        category.is_active
                      );

                    return (
                      <tr
                        key={category.id}
                        className="
                          border-b
                          border-slate-50
                          transition-colors
                          last:border-0
                          hover:bg-slate-50/70
                        "
                      >

                        {/* NAME */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-50
                                text-blue-600
                              "
                            >
                              <FolderTree
                                size={16}
                              />
                            </div>

                            <div className="min-w-0">

                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    category
                                  )
                                }
                                className="
                                  truncate
                                  text-left
                                  text-sm
                                  font-semibold
                                  text-slate-800
                                  transition
                                  hover:text-blue-600
                                "
                              >
                                {category.name}
                              </button>

                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Category #{category.id}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* DESCRIPTION */}

                        <td className="max-w-md px-6 py-4">

                          <p className="truncate text-sm text-slate-500">
                            {category.description ||
                              "No description"}
                          </p>

                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-4">

                          {active ? (

                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                bg-emerald-50
                                px-2.5
                                py-1
                                text-[11px]
                                font-semibold
                                text-emerald-600
                              "
                            >
                              <CheckCircle2
                                size={13}
                              />
                              Active
                            </span>

                          ) : (

                            <span
                              className="
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
                              "
                            >
                              <XCircle
                                size={13}
                              />
                              Inactive
                            </span>

                          )}

                        </td>


                        {/* CREATED */}

                        <td className="px-6 py-4">

                          <span className="text-xs text-slate-500">
                            {formatDate(
                              category.created_at
                            )}
                          </span>

                        </td>


                        {/* ACTION */}

                        <td className="px-6 py-4">

                          <div className="flex items-center justify-end gap-1">

                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  category
                                )
                              }
                              className="
                                rounded-lg
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-blue-600
                                transition
                                hover:bg-blue-50
                              "
                            >
                              View
                            </button>


                            {canManage && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    category
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-lg
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-semibold
                                  text-slate-600
                                  transition
                                  hover:bg-slate-100
                                  hover:text-slate-900
                                "
                              >
                                <Edit3
                                  size={13}
                                />
                                Edit
                              </button>
                            )}

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


        {/* FOOTER */}

        {filteredCategories.length > 0 && (
          <div
            className="
              border-t
              border-slate-100
              px-6
              py-3.5
              text-[11px]
              text-slate-400
            "
          >
            Showing{" "}
            {filteredCategories.length}{" "}
            of{" "}
            {categories.length}{" "}
            categories
          </div>
        )}

      </div>


      {/* =================================================
          FORM MODAL
      ================================================= */}

      <CategoryFormModal
        isOpen={formOpen}
        category={editingCategory}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={handleFormSuccess}
      />


      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      <CategoryDetailsModal
        category={selectedCategory}
        isOpen={detailsOpen}
        canManage={canManage}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedCategory(null);
        }}
        onEdit={(category) => {
          setDetailsOpen(false);
          setEditingCategory(category);
          setFormOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

    </div>
  );
};


export default Categories;