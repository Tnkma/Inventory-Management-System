import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Truck,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserRound,
} from "lucide-react";

import api from "../services/api";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });

  // =========================================================
  // LOAD SUPPLIERS
  // =========================================================

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/suppliers");

      setSuppliers(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load suppliers:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load suppliers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // =========================================================
  // FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      notes: "",
    });

    setEditingSupplier(null);
    setFormError("");
  };

  const openCreateForm = () => {
    resetForm();
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (supplier) => {
    setEditingSupplier(supplier);

    setForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      notes: supplier.notes || "",
    });

    setFormError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccess("");

    if (!form.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }

    try {
      setSaving(true);

      let response;

      if (editingSupplier) {
        response = await api.patch(
          `/suppliers/${editingSupplier.id}`,
          {
            name: form.name.trim(),
            contact_person:
              form.contact_person.trim() || null,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
            city: form.city.trim() || null,
            notes: form.notes.trim() || null,
          }
        );
      } else {
        response = await api.post("/suppliers", {
          name: form.name.trim(),
          contact_person:
            form.contact_person.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          notes: form.notes.trim() || null,
        });
      }

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to save supplier."
        );
      }

      await fetchSuppliers();

      setSuccess(
        editingSupplier
          ? "Supplier updated successfully."
          : "Supplier created successfully."
      );

      setTimeout(() => {
        setShowForm(false);
        resetForm();
      }, 700);
    } catch (err) {
      console.error("Failed to save supplier:", err);

      setFormError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save supplier."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // VIEW
  // =========================================================

  const openDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedSupplier(null);
  };

  // =========================================================
  // FILTER
  // =========================================================

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        !term ||
        supplier.name
          ?.toLowerCase()
          .includes(term) ||
        supplier.contact_person
          ?.toLowerCase()
          .includes(term) ||
        supplier.email
          ?.toLowerCase()
          .includes(term) ||
        supplier.phone
          ?.toLowerCase()
          .includes(term) ||
        supplier.city
          ?.toLowerCase()
          .includes(term);

      const active =
        Boolean(supplier.is_active);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    const active = suppliers.filter(
      (supplier) => Boolean(supplier.is_active)
    ).length;

    return {
      total: suppliers.length,
      active,
      inactive: suppliers.length - active,
    };
  }, [suppliers]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full bg-white text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
            Supplier Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Suppliers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the suppliers that provide ingredients and restaurant supplies.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
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
          Add Supplier
        </button>

      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Truck size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Total suppliers
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Active suppliers
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.active}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Truck size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Inactive suppliers
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.inactive}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* =====================================================
          SUPPLIER TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* FILTER BAR */}

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full sm:max-w-md">

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
              placeholder="Search suppliers..."
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

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="
              h-10
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3
              text-sm
              font-medium
              text-slate-600
              outline-none
              focus:border-blue-300
              focus:ring-4
              focus:ring-blue-500/10
            "
          >
            <option value="ALL">
              All suppliers
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>

        </div>

        {/* ERROR */}

        {error && (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load suppliers
              </p>

              <p className="mt-0.5 text-xs">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Loader2
                size={28}
                className="mx-auto animate-spin text-blue-600"
              />

              <p className="mt-3 text-sm font-medium text-slate-600">
                Loading suppliers...
              </p>
            </div>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredSuppliers.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Truck size={22} />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-800">
                No suppliers found
              </p>

              <p className="mt-1 max-w-sm text-xs text-slate-500">
                {search
                  ? "Try changing your search."
                  : "Create your first supplier to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={15} />
                  Add Supplier
                </button>
              )}

            </div>
          )}

        {/* TABLE */}

        {!loading &&
          !error &&
          filteredSuppliers.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">

                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Supplier
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Contact
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Location
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredSuppliers.map((supplier) => {

                    const active =
                      Boolean(supplier.is_active);

                    return (
                      <tr
                        key={supplier.id}
                        className="border-b border-slate-50 transition hover:bg-slate-50/60"
                      >

                        {/* SUPPLIER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <Truck size={17} />
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-slate-800">
                                {supplier.name}
                              </p>

                              {supplier.email && (
                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                  {supplier.email}
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">

                          <div className="space-y-1">

                            {supplier.contact_person && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <UserRound size={13} className="text-slate-400" />
                                {supplier.contact_person}
                              </div>
                            )}

                            {supplier.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone size={13} className="text-slate-400" />
                                {supplier.phone}
                              </div>
                            )}

                          </div>

                        </td>

                        {/* LOCATION */}

                        <td className="px-5 py-4">

                          {supplier.city || supplier.address ? (
                            <div className="flex items-start gap-1.5 text-xs text-slate-600">

                              <MapPin
                                size={14}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />

                              <span>
                                {supplier.city || supplier.address}
                              </span>

                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              —
                            </span>
                          )}

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex
                              items-center
                              rounded-full
                              px-2.5
                              py-1
                              text-[11px]
                              font-semibold
                              ${
                                active
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }
                            `}
                          >
                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-1">

                            <button
                              type="button"
                              onClick={() =>
                                openDetails(supplier)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="View supplier"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(supplier)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                              title="Edit supplier"
                            >
                              <Pencil size={16} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingSupplier
                    ? "Edit supplier"
                    : "Add supplier"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {editingSupplier
                    ? "Update supplier information."
                    : "Add a supplier to your restaurant inventory system."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-6"
            >

              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={17} />
                  <span>{success}</span>
                </div>
              )}

              {/* NAME */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Supplier name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Fresh Foods Ltd"
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* CONTACT */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Contact person
                </label>

                <input
                  name="contact_person"
                  value={form.contact_person}
                  onChange={handleChange}
                  placeholder="e.g. John Smith"
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* EMAIL + PHONE */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Email
                  </label>

                  <div className="relative">

                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="supplier@example.com"
                      disabled={saving}
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Phone
                  </label>

                  <div className="relative">

                    <Phone
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      disabled={saving}
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>
                </div>

              </div>

              {/* CITY */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  City
                </label>

                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Lagos"
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* ADDRESS */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Address
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Supplier address"
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional supplier information..."
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* ACTIONS */}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      {editingSupplier
                        ? "Save changes"
                        : "Create supplier"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {showDetails && selectedSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Truck size={19} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {selectedSupplier.name}
                  </h2>

                  <span
                    className={`
                      mt-1
                      inline-flex
                      rounded-full
                      px-2
                      py-0.5
                      text-[10px]
                      font-semibold
                      ${
                        selectedSupplier.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }
                    `}
                  >
                    {selectedSupplier.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-4 px-6 py-6">

              <DetailRow
                icon={UserRound}
                label="Contact person"
                value={
                  selectedSupplier.contact_person
                }
              />

              <DetailRow
                icon={Mail}
                label="Email"
                value={selectedSupplier.email}
              />

              <DetailRow
                icon={Phone}
                label="Phone"
                value={selectedSupplier.phone}
              />

              <DetailRow
                icon={MapPin}
                label="City"
                value={selectedSupplier.city}
              />

              <DetailRow
                icon={MapPin}
                label="Address"
                value={selectedSupplier.address}
              />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Notes
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {selectedSupplier.notes || "No notes available."}
                </p>
              </div>

            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">

              <button
                type="button"
                onClick={() => {
                  closeDetails();
                  openEditForm(selectedSupplier);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Pencil size={14} />
                Edit supplier
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};


// =========================================================
// DETAIL ROW
// =========================================================

const DetailRow = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon size={15} />
      </div>

      <div className="min-w-0">

        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm text-slate-700">
          {value || "Not provided"}
        </p>

      </div>

    </div>
  );
};

export default Suppliers;