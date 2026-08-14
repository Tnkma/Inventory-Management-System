import {
  CalendarDays,
  PackageX,
  User,
  X,
} from "lucide-react";


const WastageDetailsModal = ({
  isOpen,
  wastage,
  onClose,
}) => {

  if (
    !isOpen ||
    !wastage
  ) {
    return null;
  }


  const formatNumber = (
    value
  ) => {

    return Number(
      value || 0
    ).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 3,
      }
    );

  };


  const formatDateTime = (
    value
  ) => {

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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


  return (

    <div
      className="
        fixed
        inset-0
        z-[80]
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
              bg-red-50
              text-red-600
            ">

              <PackageX size={19} />

            </div>


            <div>

              <h2 className="
                text-base
                font-semibold
                text-slate-900
              ">
                Wastage Details
              </h2>


              <p className="
                mt-0.5
                text-xs
                text-slate-500
              ">
                Stock movement #{wastage.id}
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


        {/* =================================================
            BODY
        ================================================= */}

        <div className="
          space-y-5
          px-6
          py-6
        ">

          {/* INGREDIENT */}

          <div className="
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            p-4
          ">

            <p className="
              text-[11px]
              font-medium
              uppercase
              tracking-wide
              text-slate-400
            ">
              Ingredient
            </p>


            <p className="
              mt-1.5
              text-base
              font-bold
              text-slate-900
            ">
              {wastage.ingredient ||
                "—"}
            </p>


            {wastage.sku && (

              <p className="
                mt-0.5
                text-xs
                text-slate-400
              ">
                SKU: {wastage.sku}
              </p>

            )}

          </div>


          {/* QUANTITY / LOCATION */}

          <div className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
          ">

            <div className="
              rounded-xl
              border
              border-red-100
              bg-red-50/50
              p-4
            ">

              <p className="
                text-[11px]
                font-medium
                uppercase
                tracking-wide
                text-red-400
              ">
                Wasted Quantity
              </p>


              <p className="
                mt-1.5
                text-xl
                font-bold
                text-red-700
              ">
                {formatNumber(
                  wastage.quantity
                )}{" "}
                <span className="
                  text-sm
                  font-semibold
                  text-slate-400
                ">
                  {wastage.unit || ""}
                </span>
              </p>

            </div>


            <div className="
              rounded-xl
              border
              border-slate-100
              p-4
            ">

              <p className="
                text-[11px]
                font-medium
                uppercase
                tracking-wide
                text-slate-400
              ">
                Location
              </p>


              <p className="
                mt-1.5
                text-sm
                font-semibold
                text-slate-800
              ">
                {wastage.location ||
                  "—"}
              </p>

            </div>

          </div>


          {/* STOCK CHANGE */}

          <div className="
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            p-4
          ">

            <p className="
              text-[11px]
              font-medium
              uppercase
              tracking-wide
              text-slate-400
            ">
              Inventory Change
            </p>


            <div className="
              mt-3
              grid
              grid-cols-2
              gap-4
            ">

              <div>

                <p className="
                  text-[10px]
                  text-slate-400
                ">
                  Previous Quantity
                </p>


                <p className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-700
                ">
                  {formatNumber(
                    wastage.previous_quantity
                  )}{" "}
                  {wastage.unit || ""}
                </p>

              </div>


              <div>

                <p className="
                  text-[10px]
                  text-slate-400
                ">
                  New Quantity
                </p>


                <p className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-700
                ">
                  {formatNumber(
                    wastage.new_quantity
                  )}{" "}
                  {wastage.unit || ""}
                </p>

              </div>

            </div>

          </div>


          {/* REASON */}

          <div>

            <p className="
              text-xs
              font-semibold
              text-slate-700
            ">
              Wastage Reason
            </p>


            <div className="
              mt-2
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              px-4
              py-3
            ">

              <p className="
                whitespace-pre-wrap
                text-xs
                leading-5
                text-slate-600
              ">
                {wastage.reason ||
                  "—"}
              </p>

            </div>

          </div>


          {/* META */}

          <div className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
          ">

            <div>

              <div className="
                flex
                items-center
                gap-1.5
              ">

                <User
                  size={13}
                  className="text-slate-400"
                />

                <p className="
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-wide
                  text-slate-400
                ">
                  Recorded By
                </p>

              </div>


              <p className="
                mt-1
                text-sm
                font-semibold
                text-slate-700
              ">
                {wastage.created_by_name ||
                  "—"}
              </p>

            </div>


            <div>

              <div className="
                flex
                items-center
                gap-1.5
              ">

                <CalendarDays
                  size={13}
                  className="text-slate-400"
                />

                <p className="
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-wide
                  text-slate-400
                ">
                  Date
                </p>

              </div>


              <p className="
                mt-1
                text-sm
                font-semibold
                text-slate-700
              ">
                {formatDateTime(
                  wastage.created_at
                )}
              </p>

            </div>

          </div>

        </div>


        {/* FOOTER */}

        <div className="
          flex
          justify-end
          border-t
          border-slate-100
          px-6
          py-4
        ">

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

        </div>

      </div>

    </div>

  );

};


export default WastageDetailsModal;