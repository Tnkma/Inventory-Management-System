import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import UserDetailsModal from "../components/UserDetailsModal";
import UserFormModal from "../components/UserFormModal";


// =========================================================
// HELPERS
// =========================================================

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


const getRoleLabel = (role) => {

  switch (
    String(role || "").toUpperCase()
  ) {

    case "ADMIN":
      return "Admin";

    case "MANAGER":
      return "Manager";

    case "STORE_KEEPER":
      return "Store Keeper";

    case "KITCHEN_STAFF":
      return "Kitchen Staff";

    default:
      return role || "Unknown";
  }
};


const getRoleClasses = (role) => {

  switch (
    String(role || "").toUpperCase()
  ) {

    case "ADMIN":
      return "bg-violet-50 text-violet-700";

    case "MANAGER":
      return "bg-blue-50 text-blue-700";

    case "STORE_KEEPER":
      return "bg-amber-50 text-amber-700";

    case "KITCHEN_STAFF":
      return "bg-emerald-50 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};


// =========================================================
// COMPONENT
// =========================================================

const Users = () => {

  const { user: currentUser } =
    useAuth();


  // =======================================================
  // DATA
  // =======================================================

  const [users, setUsers] =
    useState([]);

  const [locations, setLocations] =
    useState([]);


  // =======================================================
  // PAGE STATE
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  // =======================================================
  // FILTERS
  // =======================================================

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");


  // =======================================================
  // USER FORM
  // =======================================================

  const [formOpen, setFormOpen] =
    useState(false);


  // =======================================================
  // USER DETAILS
  // =======================================================

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);


  // =======================================================
  // CURRENT USER ROLE
  // =======================================================

  const currentUserRole =
    String(
      currentUser?.role || ""
    ).toUpperCase();


  const canManageUsers =
    currentUserRole === "ADMIN" ||
    currentUserRole === "MANAGER";


  const canCreateUser =
    currentUserRole === "ADMIN";


  const canChangeRole =
    currentUserRole === "ADMIN";


  const canChangeStatus =
    currentUserRole === "ADMIN";


  // =======================================================
  // FETCH USERS
  // =======================================================

  const fetchUsers = async (
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
        await api.get(
          "/users"
        );


      setUsers(
        response.data?.data || []
      );

    } catch (err) {

      console.error(
        "Failed to load users:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to load users."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  // =======================================================
  // FETCH LOCATIONS
  // =======================================================

  const fetchLocations = async () => {

    try {

      const response =
        await api.get(
          "/inventory-locations"
        );


      setLocations(
        response.data?.data || []
      );

    } catch (err) {

      console.error(
        "Failed to load inventory locations:",
        err
      );

    }
  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    const load =
      async () => {

        await Promise.all([
          fetchUsers(true),
          fetchLocations(),
        ]);

      };


    load();

  }, []);


  // =======================================================
  // FILTER USERS
  // =======================================================

  const filteredUsers =
    useMemo(() => {

      const searchTerm =
        search
          .trim()
          .toLowerCase();


      return users.filter(
        (user) => {

          const fullName =
            `${user.first_name || ""} ${
              user.last_name || ""
            }`.trim();


          const matchesSearch =
            !searchTerm ||

            fullName
              .toLowerCase()
              .includes(searchTerm) ||

            user.email
              ?.toLowerCase()
              .includes(searchTerm) ||

            user.phone
              ?.toLowerCase()
              .includes(searchTerm);


          const matchesRole =
            roleFilter === "ALL" ||
            String(
              user.role || ""
            ).toUpperCase() ===
              roleFilter;


          const matchesStatus =
            statusFilter === "ALL" ||

            (
              statusFilter === "ACTIVE" &&
              Boolean(user.is_active)
            ) ||

            (
              statusFilter === "INACTIVE" &&
              !Boolean(user.is_active)
            );


          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          );

        }
      );

    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ]);


  // =======================================================
  // SUMMARY
  // =======================================================

  const summary =
    useMemo(() => {

      const active =
        users.filter(
          (user) =>
            Boolean(user.is_active)
        ).length;


      const inactive =
        users.length -
        active;


      const kitchenStaff =
        users.filter(
          (user) =>
            String(
              user.role || ""
            ).toUpperCase() ===
            "KITCHEN_STAFF"
        ).length;


      const managers =
        users.filter(
          (user) =>
            String(
              user.role || ""
            ).toUpperCase() ===
            "MANAGER"
        ).length;


      return {
        total: users.length,
        active,
        inactive,
        kitchenStaff,
        managers,
      };

    }, [users]);


  // =======================================================
  // VIEW USER
  // =======================================================

  const handleView = (
    user
  ) => {

    setSelectedUser(
      user
    );

    setDetailsOpen(
      true
    );

  };


  // =======================================================
  // CREATE SUCCESS
  // =======================================================

  const handleFormSuccess =
    async () => {

      setFormOpen(false);

      await fetchUsers(
        false
      );

    };


  // =======================================================
  // USER UPDATED
  // =======================================================

  const handleUserUpdated =
    async (updatedUser) => {

      if (updatedUser?.id) {

        setUsers(
          (current) =>
            current.map(
              (user) =>
                Number(user.id) ===
                Number(updatedUser.id)
                  ? {
                      ...user,
                      ...updatedUser,
                    }
                  : user
            )
        );


        setSelectedUser(
          (current) =>
            current
              ? {
                  ...current,
                  ...updatedUser,
                }
              : current
        );

      }


      await fetchUsers(
        false
      );

    };


  // =======================================================
  // CLEAR FILTERS
  // =======================================================

  const hasActiveFilters =
    search.trim() !== "" ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL";


  const clearFilters = () => {

    setSearch("");

    setRoleFilter(
      "ALL"
    );

    setStatusFilter(
      "ALL"
    );

  };


  // =======================================================
  // LOADING
  // =======================================================

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
              bg-violet-50
              text-violet-600
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
              Loading users
            </p>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              Fetching user accounts...
            </p>

          </div>

        </div>

      </div>

    );

  }


  // =======================================================
  // ACCESS GUARD
  // =======================================================

  if (!canManageUsers) {

    return (

      <div className="
        flex
        min-h-[500px]
        items-center
        justify-center
        bg-white
      ">

        <div className="
          max-w-md
          text-center
        ">

          <div className="
            mx-auto
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-red-50
            text-red-500
          ">

            <ShieldCheck size={21} />

          </div>


          <h2 className="
            mt-4
            text-lg
            font-bold
            text-slate-800
          ">
            Access restricted
          </h2>


          <p className="
            mt-1
            text-sm
            text-slate-500
          ">
            You do not have permission to manage users.
          </p>

        </div>

      </div>

    );

  }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div className="
      min-h-full
      bg-white
      text-slate-900
    ">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="
        mb-7
        flex
        flex-col
        gap-5
        sm:flex-row
        sm:items-center
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
              Users
            </h1>


            {refreshing && (

              <RefreshCw
                size={15}
                className="
                  animate-spin
                  text-violet-500
                "
              />

            )}

          </div>


          <p className="
            mt-1
            text-sm
            text-slate-500
          ">
            Manage user accounts, roles, kitchen assignments and account status.
          </p>

        </div>


        <div className="
          flex
          items-center
          gap-2
        ">

          <button
            type="button"
            onClick={() =>
              fetchUsers(false)
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


          {canCreateUser && (

            <button
              type="button"
              onClick={() =>
                setFormOpen(true)
              }
              className="
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                bg-violet-600
                px-4
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-violet-700
              "
            >

              <Plus size={16} />

              Add User

            </button>

          )}

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="
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
        ">

          <XCircle
            size={18}
            className="
              mt-0.5
              shrink-0
              text-red-500
            "
          />


          <div>

            <p className="
              text-sm
              font-semibold
              text-red-700
            ">
              User operation failed
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


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-4
      ">

        {/* TOTAL */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
        ">

          <div className="
            flex
            items-start
            justify-between
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-violet-50
              text-violet-600
            ">

              <User size={19} />

            </div>


            <span className="
              rounded-full
              bg-violet-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-violet-600
            ">
              Total Users
            </span>

          </div>


          <p className="
            mt-5
            text-3xl
            font-bold
            text-slate-900
          ">
            {summary.total}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Registered system users
          </p>

        </div>


        {/* ACTIVE */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
        ">

          <div className="
            flex
            items-start
            justify-between
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-emerald-50
              text-emerald-600
            ">

              <UserCheck size={19} />

            </div>


            <span className="
              rounded-full
              bg-emerald-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-emerald-600
            ">
              Active
            </span>

          </div>


          <p className="
            mt-5
            text-3xl
            font-bold
            text-slate-900
          ">
            {summary.active}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Users currently enabled
          </p>

        </div>


        {/* KITCHEN STAFF */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
        ">

          <div className="
            flex
            items-start
            justify-between
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-blue-50
              text-blue-600
            ">

              <MapPin size={19} />

            </div>


            <span className="
              rounded-full
              bg-blue-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-blue-600
            ">
              Kitchen Staff
            </span>

          </div>


          <p className="
            mt-5
            text-3xl
            font-bold
            text-slate-900
          ">
            {summary.kitchenStaff}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Staff assigned to kitchens
          </p>

        </div>


        {/* MANAGERS */}

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
        ">

          <div className="
            flex
            items-start
            justify-between
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-amber-50
              text-amber-600
            ">

              <ShieldCheck size={19} />

            </div>


            <span className="
              rounded-full
              bg-amber-50
              px-2.5
              py-1
              text-[11px]
              font-semibold
              text-amber-600
            ">
              Managers
            </span>

          </div>


          <p className="
            mt-5
            text-3xl
            font-bold
            text-slate-900
          ">
            {summary.managers}
          </p>


          <p className="
            mt-1.5
            text-xs
            text-slate-400
          ">
            Users with manager access
          </p>

        </div>

      </div>


      {/* =================================================
          USERS TABLE
      ================================================= */}

      <div className="
        mt-5
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      ">

        {/* FILTER BAR */}

        <div className="
          flex
          flex-col
          gap-4
          border-b
          border-slate-100
          p-5
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
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search users..."
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
                focus:border-violet-300
                focus:ring-4
                focus:ring-violet-500/10
              "
            />

          </div>


          <div className="
            flex
            flex-wrap
            items-center
            gap-3
          ">

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
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
                focus:border-violet-300
                focus:ring-4
                focus:ring-violet-500/10
              "
            >

              <option value="ALL">
                All roles
              </option>

              <option value="ADMIN">
                Admin
              </option>

              <option value="MANAGER">
                Manager
              </option>

              <option value="STORE_KEEPER">
                Store Keeper
              </option>

              <option value="KITCHEN_STAFF">
                Kitchen Staff
              </option>

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
                bg-white
                px-3.5
                text-sm
                font-medium
                text-slate-600
                outline-none
                focus:border-violet-300
                focus:ring-4
                focus:ring-violet-500/10
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
                  rounded-lg
                  px-3
                  text-xs
                  font-semibold
                  text-violet-600
                  transition
                  hover:bg-violet-50
                "
              >
                Clear filters
              </button>

            )}

          </div>

        </div>


        {/* EMPTY */}

        {filteredUsers.length === 0 && (

          <div className="
            p-14
            text-center
          ">

            <User
              size={28}
              className="
                mx-auto
                text-slate-300
              "
            />


            <p className="
              mt-4
              text-sm
              font-semibold
              text-slate-700
            ">
              No users found
            </p>


            <p className="
              mt-1
              text-xs
              text-slate-400
            ">
              {hasActiveFilters
                ? "Try changing your search or filters."
                : "No user accounts have been created yet."}
            </p>


            {!hasActiveFilters &&
              canCreateUser && (

                <button
                  type="button"
                  onClick={() =>
                    setFormOpen(true)
                  }
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-violet-50
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-violet-600
                    hover:bg-violet-100
                  "
                >

                  <Plus size={14} />

                  Add User

                </button>

              )}

          </div>

        )}


        {/* TABLE */}

        {filteredUsers.length > 0 && (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="
                  border-b
                  border-slate-100
                  bg-slate-50/60
                ">

                  <th className="
                    px-5
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    User
                  </th>


                  <th className="
                    px-5
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Role
                  </th>


                  <th className="
                    px-5
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Kitchen
                  </th>


                  <th className="
                    px-5
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Status
                  </th>


                  <th className="
                    px-5
                    py-3.5
                    text-left
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Last Login
                  </th>


                  <th className="
                    px-5
                    py-3.5
                    text-right
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredUsers.map(
                  (user) => {

                    const active =
                      Boolean(
                        user.is_active
                      );


                    const role =
                      String(
                        user.role || ""
                      ).toUpperCase();


                    const fullName =
                      `${user.first_name || ""} ${
                        user.last_name || ""
                      }`.trim();


                    return (

                      <tr
                        key={user.id}
                        className="
                          border-b
                          border-slate-50
                          last:border-0
                          transition-colors
                          hover:bg-slate-50/70
                        "
                      >

                        {/* USER */}

                        <td className="
                          px-5
                          py-4
                        ">

                          <div className="
                            flex
                            items-center
                            gap-3
                          ">

                            <div className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-violet-50
                              text-violet-600
                            ">

                              <User size={16} />

                            </div>


                            <div className="min-w-0">

                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    user
                                  )
                                }
                                className="
                                  truncate
                                  text-left
                                  text-sm
                                  font-semibold
                                  text-slate-800
                                  hover:text-violet-600
                                "
                              >
                                {fullName ||
                                  "Unnamed User"}
                              </button>


                              <div className="
                                mt-0.5
                                flex
                                items-center
                                gap-1
                                text-[11px]
                                text-slate-400
                              ">

                                <Mail
                                  size={11}
                                />

                                {user.email}

                              </div>

                            </div>

                          </div>

                        </td>


                        {/* ROLE */}

                        <td className="
                          px-5
                          py-4
                        ">

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              px-2.5
                              py-1
                              text-[10px]
                              font-semibold
                              ${getRoleClasses(role)}
                            `}
                          >

                            <ShieldCheck
                              size={11}
                            />

                            {getRoleLabel(
                              role
                            )}

                          </span>

                        </td>


                        {/* KITCHEN */}

                        <td className="
                          px-5
                          py-4
                        ">

                          {role === "KITCHEN_STAFF" ? (

                            user.assigned_location ? (

                              <div className="
                                flex
                                items-center
                                gap-2
                              ">

                                <div className="
                                  flex
                                  h-7
                                  w-7
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-blue-50
                                  text-blue-600
                                ">

                                  <MapPin
                                    size={13}
                                  />

                                </div>


                                <span className="
                                  text-xs
                                  font-semibold
                                  text-slate-700
                                ">
                                  {user.assigned_location}
                                </span>

                              </div>

                            ) : (

                              <span className="
                                text-xs
                                font-medium
                                text-amber-600
                              ">
                                Not assigned
                              </span>

                            )

                          ) : (

                            <span className="
                              text-xs
                              text-slate-400
                            ">
                              —
                            </span>

                          )}

                        </td>


                        {/* STATUS */}

                        <td className="
                          px-5
                          py-4
                        ">

                          {active ? (

                            <span className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              bg-emerald-50
                              px-2.5
                              py-1
                              text-[10px]
                              font-semibold
                              text-emerald-700
                            ">

                              <CheckCircle2
                                size={12}
                              />

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
                              text-[10px]
                              font-semibold
                              text-slate-500
                            ">

                              <UserX
                                size={12}
                              />

                              Inactive

                            </span>

                          )}

                        </td>


                        {/* LAST LOGIN */}

                        <td className="
                          whitespace-nowrap
                          px-5
                          py-4
                        ">

                          <span className="
                            text-xs
                            text-slate-500
                          ">
                            {formatDate(
                              user.last_login_at
                            )}
                          </span>

                        </td>


                        {/* ACTION */}

                        <td className="
                          px-5
                          py-4
                          text-right
                        ">

                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                user
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
                              text-violet-600
                              transition
                              hover:bg-violet-50
                            "
                          >

                            <Edit3
                              size={13}
                            />

                            Manage

                          </button>

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

        {filteredUsers.length > 0 && (

          <div className="
            border-t
            border-slate-100
            px-6
            py-3.5
            text-[11px]
            text-slate-400
          ">

            Showing{" "}
            {filteredUsers.length}{" "}
            of{" "}
            {users.length}{" "}
            users

          </div>

        )}

      </div>


      {/* =================================================
          CREATE USER MODAL
      ================================================= */}

      <UserFormModal
        isOpen={
          formOpen
        }

        onClose={() =>
          setFormOpen(false)
        }

        onSuccess={
          handleFormSuccess
        }
      />


      {/* =================================================
          USER DETAILS MODAL
      ================================================= */}

      <UserDetailsModal
        user={
          selectedUser
        }

        locations={
          locations
        }

        isOpen={
          detailsOpen
        }

        canChangeRole={
          canChangeRole
        }

        canChangeStatus={
          canChangeStatus
        }

        onClose={() => {

          setDetailsOpen(
            false
          );

          setSelectedUser(
            null
          );

        }}

        onUpdated={
          handleUserUpdated
        }
      />

    </div>

  );

};


export default Users;