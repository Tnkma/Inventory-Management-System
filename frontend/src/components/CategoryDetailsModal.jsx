import {
  CheckCircle2,
  Edit3,
  FolderTree,
  X,
  XCircle,
} from "lucide-react";


const formatDate = (value) => {

  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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


const CategoryDetailsModal = ({
  category,
  isOpen,
  canManage,
  onClose,
  onEdit,
  onToggleStatus,
}) => {

  if (!isOpen || !category) {
    return null;
  }


  const active =
    Boolean(category.is_active);


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
          max-h-[90vh]
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >

        {/* HEADER */}

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
              <FolderTree size={19} />
            </div>

            <div>

              <h2 className="text-base font-semibold text-slate-900">
                {category.name}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Category details
              </p>

            </div>

          </div>


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


        {/* BODY */}

        <div className="overflow-y-auto px-6 py-6">

          {/* STATUS */}

          <div
            className={`
              flex
              items-center
              justify-between
              rounded-xl
              border
              px-5
              py-4
              ${
                active
                  ? "border-emerald-100 bg-emerald-50/60"
                  : "border-slate-200 bg-slate-50"
              }
            `}
          >

            <div className="flex items-center gap-3">

              {active ? (
                <CheckCircle2
                  size={20}
                  className="text-emerald-600"
                />
              ) : (
                <XCircle
                  size={20}
                  className="text-slate-500"
                />
              )}

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  {active
                    ? "Category is active"
                    : "Category is inactive"}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {active
                    ? "This category can be used for active ingredients."
                    : "This category is currently inactive."}
                </p>

              </div>

            </div>


            <span
              className={`
                rounded-full
                px-3
                py-1
                text-xs
                font-semibold
                ${
                  active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }
              `}
            >
              {active
                ? "ACTIVE"
                : "INACTIVE"}
            </span>

          </div>


          {/* DETAILS */}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div
              className="
                rounded-xl
                border
                border-slate-100
                bg-slate-50
                p-4
              "
            >

              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Category ID
              </p>

              <p className="mt-1.5 text-sm font-semibold text-slate-800">
                #{category.id}
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

              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Created
              </p>

              <p className="mt-1.5 text-sm font-semibold text-slate-800">
                {formatDate(
                  category.created_at
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
                sm:col-span-2
              "
            >

              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Last Updated
              </p>

              <p className="mt-1.5 text-sm font-semibold text-slate-800">
                {formatDate(
                  category.updated_at
                )}
              </p>

            </div>

          </div>


          {/* DESCRIPTION */}

          <div className="mt-5">

            <p className="text-xs font-semibold text-slate-700">
              Description
            </p>

            <div
              className="
                mt-2
                rounded-xl
                border
                border-slate-100
                bg-slate-50
                px-4
                py-4
              "
            >

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {category.description ||
                  "No description provided."}
              </p>

            </div>

          </div>

        </div>


        {/* FOOTER */}

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
                  onToggleStatus(
                    category
                  )
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
                    <CheckCircle2
                      size={15}
                    />
                    Activate
                  </>
                )}

              </button>


              <button
                type="button"
                onClick={() =>
                  onEdit(category)
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
                  transition
                  hover:bg-blue-700
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


export default CategoryDetailsModal;