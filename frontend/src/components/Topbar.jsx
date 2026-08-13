import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Menu,
  Command,
} from "lucide-react";

const Topbar = ({ onMenuClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(currentDate);

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-[68px]
        items-center
        border-b
        border-slate-200
        bg-white/95
        px-4
        backdrop-blur
        sm:px-6
        lg:px-7
      "
    >

      {/* =====================================================
          LEFT
      ===================================================== */}

      <div className="flex min-w-0 flex-1 items-center gap-3">

        {/* Mobile menu */}

        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-slate-500
            transition-colors
            hover:bg-slate-100
            hover:text-slate-900
            lg:hidden
          "
        >
          <Menu size={19} strokeWidth={1.8} />
        </button>


        {/* Search */}

        <div
          className="
            group
            relative
            w-full
            max-w-[520px]
          "
        >

          <Search
            size={17}
            strokeWidth={1.8}
            className="
              pointer-events-none
              absolute
              left-3.5
              top-1/2
              -translate-y-1/2
              text-slate-400
              transition-colors
              group-focus-within:text-blue-600
            "
          />

          <input
            type="search"
            placeholder="Search inventory, ingredients, suppliers..."
            className="
              h-10
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              pl-10
              pr-20
              text-sm
              text-slate-800
              outline-none
              transition-all
              placeholder:text-slate-400
              hover:border-slate-300
              hover:bg-white
              focus:border-blue-300
              focus:bg-white
              focus:ring-4
              focus:ring-blue-500/10
            "
          />


          {/* Keyboard shortcut */}

          <div
            className="
              pointer-events-none
              absolute
              right-2.5
              top-1/2
              hidden
              -translate-y-1/2
              items-center
              gap-1
              rounded-md
              border
              border-slate-200
              bg-white
              px-1.5
              py-0.5
              text-[10px]
              font-medium
              text-slate-400
              shadow-sm
              sm:flex
            "
          >
            <Command size={10} />

            <span>K</span>
          </div>

        </div>

      </div>


      {/* =====================================================
          RIGHT
      ===================================================== */}

      <div className="ml-4 flex shrink-0 items-center gap-2 sm:gap-4">

        {/* Date */}

        <div
          className="
            hidden
            items-center
            border-r
            border-slate-200
            pr-4
            sm:flex
          "
        >

          <p
            className="
              text-xs
              font-medium
              text-slate-500
            "
          >
            {formattedDate}
          </p>

        </div>


        {/* Notifications */}

        <button
          type="button"
          aria-label="Notifications"
          className="
            group
            relative
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            text-slate-500
            transition-all
            hover:bg-slate-100
            hover:text-slate-900
          "
        >

          <Bell
            size={18}
            strokeWidth={1.8}
            className="
              transition-transform
              group-hover:scale-105
            "
          />


          {/* Unread indicator */}

          <span
            className="
              absolute
              right-2.5
              top-2
              h-1.5
              w-1.5
              rounded-full
              bg-blue-600
              ring-2
              ring-white
            "
          />

        </button>

      </div>

    </header>
  );
};

export default Topbar;