import {
  Bell,
  CalendarDays,
  ChevronDown,
  Search
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


const Topbar = () => {

  const { user } = useAuth();


  // -----------------------------------------------------
  // User information
  // -----------------------------------------------------

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";

  const fullName =
    `${firstName} ${lastName}`.trim() || "User";


  // -----------------------------------------------------
  // Generate initials
  // -----------------------------------------------------

  const initials = (
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`
  ).toUpperCase() || "U";


  // -----------------------------------------------------
  // Format role
  // -----------------------------------------------------

  const formattedRole =
    user?.role
      ? user.role
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
          )
      : "User";


  // -----------------------------------------------------
  // Current date
  // -----------------------------------------------------

  const currentDate = new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  ).format(new Date());


  return (

    <header
      className="
        flex
        items-center
        justify-between
        gap-6
        rounded-3xl
        border
        border-slate-100
        bg-white
        px-5
        py-4
        shadow-sm
        lg:px-6
      "
    >

      {/* =================================================
          GLOBAL SEARCH
      ================================================= */}

      <div className="flex min-w-0 flex-1">

        <div className="
          relative
          w-full
          max-w-xl
        ">

          <Search
            size={19}
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            type="search"
            placeholder="Search inventory, ingredients, purchases..."
            className="
              h-11
              w-full
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              pl-11
              pr-4
              text-sm
              font-medium
              text-slate-800
              outline-none
              transition-all
              duration-200
              placeholder:text-slate-400
              focus:border-blue-300
              focus:bg-white
              focus:ring-4
              focus:ring-blue-500/10
            "
          />

        </div>

      </div>


      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <div className="flex shrink-0 items-center gap-3">

        {/* -----------------------------------------------
            Date
        ----------------------------------------------- */}

        <div className="
          hidden
          items-center
          gap-2
          text-xs
          font-medium
          text-slate-400
          xl:flex
        ">

          <CalendarDays size={15} />

          <span>
            {currentDate}
          </span>

        </div>


        {/* -----------------------------------------------
            Divider
        ----------------------------------------------- */}

        <div className="
          hidden
          h-8
          w-px
          bg-slate-200
          xl:block
        " />


        {/* -----------------------------------------------
            Notifications
        ----------------------------------------------- */}

        <button
          type="button"
          className="
            relative
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-100
            bg-slate-50
            text-slate-500
            transition-all
            duration-200
            hover:bg-slate-100
            hover:text-slate-800
          "
          aria-label="Notifications"
        >

          <Bell size={19} />

          <span
            className="
              absolute
              right-2
              top-2
              h-2
              w-2
              rounded-full
              bg-red-500
              ring-2
              ring-white
            "
          />

        </button>


        {/* -----------------------------------------------
            Divider
        ----------------------------------------------- */}

        <div className="
          hidden
          h-8
          w-px
          bg-slate-200
          sm:block
        " />


        {/* -----------------------------------------------
            User
        ----------------------------------------------- */}

        <button
          type="button"
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            px-2
            py-1.5
            transition-all
            duration-200
            hover:bg-slate-50
          "
        >

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-600
              text-sm
              font-bold
              text-white
              shadow-sm
              shadow-blue-600/20
            "
          >
            {initials}
          </div>


          <div className="hidden text-left sm:block">

            <p className="
              text-sm
              font-semibold
              leading-5
              text-slate-800
            ">
              {fullName}
            </p>

            <p className="
              text-xs
              font-medium
              text-slate-400
            ">
              {formattedRole}
            </p>

          </div>


          <ChevronDown
            size={16}
            className="
              hidden
              text-slate-400
              sm:block
            "
          />

        </button>

      </div>

    </header>

  );
};


export default Topbar;