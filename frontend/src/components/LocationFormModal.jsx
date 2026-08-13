import { useEffect, useState } from "react";

import { AlertCircle, Loader2, MapPin, X } from "lucide-react";

import api from "../services/api";

const LocationFormModal = ({ isOpen, location, onClose, onSuccess }) => {
  const isEditing = Boolean(location);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setName(location?.name || "");
    setDescription(location?.description || "");
    setError("");
  }, [isOpen, location]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Location name is required.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = { name: cleanName, description: description.trim() || null };

      if (isEditing) {
        await api.patch(`/inventory-locations/${location.id}`, payload);
      } else {
        await api.post("/inventory-locations", payload);
      }

      await onSuccess();
    } catch (err) {
      console.error("Failed to save location:", err);
      setError(err.response?.data?.message || "Unable to save inventory location.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <MapPin size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? "Edit Location" : "New Location"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {isEditing ? "Update this inventory location." : "Create an inventory storage location."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* NAME */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">Location Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={submitting}
              autoFocus
              placeholder="e.g. Main Store"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              Description
              <span className="ml-1 font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={submitting}
              rows={4}
              placeholder="Describe this storage location..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          {/* ACTIONS */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Location"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationFormModal;