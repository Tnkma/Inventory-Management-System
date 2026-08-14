import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

import api from "../services/api";


const UserDetailsModal = ({
  user,
  locations = [],
  isOpen,
  canChangeRole = false,
  canChangeStatus = false,
  onClose,
  onUpdated,
}) => {

  const [loading, setLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [role, setRole] =
    useState("");

  const [assignedLocationId, setAssignedLocationId] =
    useState("");

  const [status, setStatus] =
    useState(false);


  // =========================================================
  // SYNC USER
  // =========================================================

  useEffect(() => {

    if (!user) {
      return;
    }

    setRole(
      String(
        user.role || ""
      ).toUpperCase()
    );


    setAssignedLocationId(
      user.assigned_location_id ??
      ""
    );


    setStatus(
      Boolean(
        user.is_active
      )
    );


    setError("");

  }, [user]);


  // =========================================================
  // KITCHENS ONLY
  // =========================================================

  const kitchens =
    useMemo(() => {

      return locations.filter(
        (location) =>
          String(
            location.location_type || ""
          ).toUpperCase() ===
          "KITCHEN" &&
          Boolean(
            location.is_active
          )
      );

    }, [locations]);


  // =========================================================
  // FULL NAME
  // =========================================================

  const fullName =
    `${user?.first_name || ""} ${
      user?.last_name || ""
    }`.trim();


  // =========================================================
  // ROLE LABEL
  // =========================================================

  const roleLabel = (
    value
  ) => {

    switch (
      String(value || "").toUpperCase()
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
        return value || "Unknown";

    }

  };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
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


  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {

    if (actionLoading) {
      return;
    }

    setError("");

    onClose();

  };


  // =========================================================
  // UPDATE ROLE
  // =========================================================

  const handleRoleUpdate =
    async () => {

      if (!user || !canChangeRole) {
        return;
      }


      const nextRole =
        String(
          role || ""
        ).toUpperCase();


      const currentRole =
        String(
          user.role || ""
        ).toUpperCase();


      if (
        nextRole ===
        currentRole
      ) {
        return;
      }


      const confirmed =
        window.confirm(
          `Change ${fullName}'s role to ${roleLabel(nextRole)}?`
        );


      if (!confirmed) {
        setRole(currentRole);
        return;
      }


      try {

        setActionLoading(true);
        setError("");


        const response =
          await api.patch(
            `/users/${user.id}/role`,
            {
              role: nextRole,
            }
          );


        let updatedUser =
          response.data?.data ||
          null;


        // ---------------------------------------------------
        // If the user is no longer Kitchen Staff, remove
        // the kitchen assignment.
        // ---------------------------------------------------

        if (
          nextRole !==
          "KITCHEN_STAFF" &&
          (
            updatedUser?.assigned_location_id ||
            user.assigned_location_id
          )
        ) {

          const assignmentResponse =
            await api.patch(
              `/users/${user.id}/assignment`,
              {
                assignedLocationId:
                  null,
              }
            );


          updatedUser =
            assignmentResponse.data?.data ||
            updatedUser;

        }


        if (onUpdated) {
          await onUpdated(
            updatedUser
          );
        }

      } catch (err) {

        console.error(
          "Failed to update user role:",
          err
        );


        setError(
          err.response?.data?.message ||
          "Unable to update user role."
        );


        setRole(
          currentRole
        );

      } finally {

        setActionLoading(false);

      }

    };


  // =========================================================
  // UPDATE ASSIGNMENT
  // =========================================================

  const handleAssignmentUpdate =
    async () => {

      if (
        !user ||
        !canChangeRole ||
        role !== "KITCHEN_STAFF"
      ) {
        return;
      }


      const currentLocation =
        String(
          user.assigned_location_id ??
          ""
        );


      const nextLocation =
        String(
          assignedLocationId ??
          ""
        );


      if (
        currentLocation ===
        nextLocation
      ) {
        return;
      }


      const selectedKitchen =
        kitchens.find(
          (location) =>
            String(location.id) ===
            nextLocation
        );


      const actionText =
        nextLocation
          ? `assign ${fullName} to ${selectedKitchen?.name || "this kitchen"}`
          : `remove ${fullName}'s kitchen assignment`;


      const confirmed =
        window.confirm(
          `Are you sure you want to ${actionText}?`
        );


      if (!confirmed) {
        setAssignedLocationId(
          user.assigned_location_id ?? ""
        );

        return;
      }


      try {

        setActionLoading(true);
        setError("");


        const response =
          await api.patch(
            `/users/${user.id}/assignment`,
            {
              assignedLocationId:
                nextLocation
                  ? Number(nextLocation)
                  : null,
            }
          );


        const updatedUser =
          response.data?.data ||
          null;


        if (onUpdated) {
          await onUpdated(
            updatedUser
          );
        }

      } catch (err) {

        console.error(
          "Failed to update user assignment:",
          err
        );


        setError(
          err.response?.data?.message ||
          "Unable to update kitchen assignment."
        );


        setAssignedLocationId(
          user.assigned_location_id ?? ""
        );

      } finally {

        setActionLoading(false);

      }

    };


  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const handleStatusUpdate =
    async () => {

      if (
        !user ||
        !canChangeStatus
      ) {
        return;
      }


      const nextStatus =
        !status;


      const action =
        nextStatus
          ? "activate"
          : "deactivate";


      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} ${fullName}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setActionLoading(true);
        setError("");


        const response =
          await api.patch(
            `/users/${user.id}/status`,
            {
              isActive:
                nextStatus,
            }
          );


        const updatedUser =
          response.data?.data ||
          null;


        setStatus(
          nextStatus
        );


        if (onUpdated) {
          await onUpdated(
            updatedUser
          );
        }

      } catch (err) {

        console.error(
          "Failed to update user status:",
          err
        );


        setError(
          err.response?.data?.message ||
          "Unable to update user status."
        );

      } finally {

        setActionLoading(false);

      }

    };


  if (!isOpen || !user) {
    return null;
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div
      className="
        fixed
        inset-0
        z-[70]
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
          handleClose();
        }

      }}
    >

      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="
          flex
          shrink-0
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
              bg-violet-50
              text-violet-600
            ">

              <User size={19} />

            </div>


            <div>

              <h2 className="
                text-base
                font-semibold
                text-slate-900
              ">
                User Details
              </h2>


              <p className="
                mt-0.5
                text-xs
                text-slate-500
              ">
                Manage account access and kitchen assignment.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={actionLoading}
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
              disabled:opacity-50
            "
          >

            <X size={18} />

          </button>

        </div>


        {/* =====================================================
            BODY
        ===================================================== */}

        <div className="
          overflow-y-auto
          px-6
          py-6
        ">

          {/* ERROR */}

          {error && (

            <div className="
              mb-5
              flex
              items-start
              gap-2.5
              rounded-xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            ">

              <AlertCircle
                size={17}
                className="
                  mt-0.5
                  shrink-0
                "
              />

              <p>
                {error}
              </p>

            </div>

          )}


          {/* =================================================
              USER PROFILE
          ================================================= */}

          <div className="
            rounded-2xl
            border
            border-slate-200
            bg-slate-50/60
            p-5
          ">

            <div className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            ">

              <div className="
                flex
                items-center
                gap-4
              ">

                <div className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-violet-100
                  text-lg
                  font-bold
                  text-violet-700
                ">

                  {(
                    user.first_name?.[0] ||
                    ""
                  ).toUpperCase()}

                  {(
                    user.last_name?.[0] ||
                    ""
                  ).toUpperCase()}

                </div>


                <div>

                  <h3 className="
                    text-lg
                    font-bold
                    text-slate-900
                  ">
                    {fullName ||
                      "Unnamed User"}
                  </h3>


                  <p className="
                    mt-0.5
                    text-xs
                    text-slate-500
                  ">
                    User #{user.id}
                  </p>

                </div>

              </div>


              <span className="
                inline-flex
                w-fit
                items-center
                gap-1.5
                rounded-full
                bg-slate-100
                px-3
                py-1.5
                text-xs
                font-semibold
                text-slate-600
              ">

                {status ? (
                  <>
                    <CheckCircle2
                      size={13}
                      className="text-emerald-600"
                    />

                    Active
                  </>
                ) : (
                  <>
                    <UserX
                      size={13}
                      className="text-slate-500"
                    />

                    Inactive
                  </>
                )}

              </span>

            </div>

          </div>


          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <div className="
            mt-5
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
          ">

            <div className="
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              p-4
            ">

              <div className="
                flex
                items-center
                gap-1.5
              ">

                <Mail
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
                  Email
                </p>

              </div>


              <p className="
                mt-1.5
                break-all
                text-sm
                font-semibold
                text-slate-800
              ">
                {user.email || "—"}
              </p>

            </div>


            <div className="
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              p-4
            ">

              <div className="
                flex
                items-center
                gap-1.5
              ">

                <Phone
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
                  Phone
                </p>

              </div>


              <p className="
                mt-1.5
                text-sm
                font-semibold
                text-slate-800
              ">
                {user.phone || "—"}
              </p>

            </div>


            <div className="
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              p-4
            ">

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
                  Created
                </p>

              </div>


              <p className="
                mt-1.5
                text-sm
                font-semibold
                text-slate-800
              ">
                {formatDate(
                  user.created_at
                )}
              </p>

            </div>


            <div className="
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              p-4
            ">

              <div className="
                flex
                items-center
                gap-1.5
              ">

                <UserCheck
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
                  Last Login
                </p>

              </div>


              <p className="
                mt-1.5
                text-sm
                font-semibold
                text-slate-800
              ">
                {formatDate(
                  user.last_login_at
                )}
              </p>

            </div>

          </div>


          {/* =================================================
              ROLE MANAGEMENT
          ================================================= */}

          <div className="
            mt-6
            rounded-2xl
            border
            border-slate-200
            p-5
          ">

            <div className="
              flex
              items-start
              justify-between
              gap-4
            ">

              <div>

                <div className="
                  flex
                  items-center
                  gap-2
                ">

                  <ShieldCheck
                    size={17}
                    className="text-violet-600"
                  />

                  <h3 className="
                    text-sm
                    font-semibold
                    text-slate-900
                  ">
                    Role & Access
                  </h3>

                </div>


                <p className="
                  mt-1
                  text-xs
                  text-slate-400
                ">
                  Control what this user can access in the system.
                </p>

              </div>

            </div>


            <div className="
              mt-4
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-end
            ">

              <div className="flex-1">

                <label className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-slate-700
                ">
                  Role
                </label>


                <select
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value
                    )
                  }
                  disabled={
                    !canChangeRole ||
                    actionLoading
                  }
                  className="
                    h-10
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-700
                    outline-none
                    transition
                    focus:border-violet-300
                    focus:ring-4
                    focus:ring-violet-500/10
                    disabled:cursor-not-allowed
                    disabled:bg-slate-50
                    disabled:text-slate-400
                  "
                >

                  <option value="KITCHEN_STAFF">
                    Kitchen Staff
                  </option>

                  <option value="STORE_KEEPER">
                    Store Keeper
                  </option>

                  <option value="MANAGER">
                    Manager
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>

                </select>

              </div>


              {canChangeRole && (

                <button
                  type="button"
                  onClick={
                    handleRoleUpdate
                  }
                  disabled={
                    actionLoading ||
                    role ===
                      String(
                        user.role || ""
                      ).toUpperCase()
                  }
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-violet-600
                    px-4
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-violet-700
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  {actionLoading ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : null}

                  Update Role

                </button>

              )}

            </div>

          </div>


          {/* =================================================
              KITCHEN ASSIGNMENT
          ================================================= */}

          {role === "KITCHEN_STAFF" && (

            <div className="
              mt-5
              rounded-2xl
              border
              border-blue-100
              bg-blue-50/40
              p-5
            ">

              <div className="
                flex
                items-start
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
                  bg-blue-100
                  text-blue-600
                ">

                  <MapPin size={16} />

                </div>


                <div>

                  <h3 className="
                    text-sm
                    font-semibold
                    text-slate-900
                  ">
                    Kitchen Assignment
                  </h3>


                  <p className="
                    mt-1
                    text-xs
                    text-slate-500
                  ">
                    Assign this Kitchen Staff member to the kitchen where they work.
                  </p>

                </div>

              </div>


              <div className="
                mt-4
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-end
              ">

                <div className="flex-1">

                  <label className="
                    mb-2
                    block
                    text-xs
                    font-semibold
                    text-slate-700
                  ">
                    Assigned Kitchen
                  </label>


                  <select
                    value={
                      assignedLocationId
                    }
                    onChange={(event) =>
                      setAssignedLocationId(
                        event.target.value
                      )
                    }
                    disabled={
                      !canChangeRole ||
                      actionLoading
                    }
                    className="
                      h-10
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3.5
                      text-sm
                      font-medium
                      text-slate-700
                      outline-none
                      transition
                      focus:border-blue-300
                      focus:ring-4
                      focus:ring-blue-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  >

                    <option value="">
                      No kitchen assigned
                    </option>


                    {kitchens.map(
                      (location) => (

                        <option
                          key={
                            location.id
                          }
                          value={
                            location.id
                          }
                        >
                          {location.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {canChangeRole && (

                  <button
                    type="button"
                    onClick={
                      handleAssignmentUpdate
                    }
                    disabled={
                      actionLoading ||
                      String(
                        assignedLocationId ?? ""
                      ) ===
                        String(
                          user.assigned_location_id ?? ""
                        )
                    }
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
                      transition
                      hover:bg-blue-700
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >

                    {actionLoading ? (

                      <Loader2
                        size={15}
                        className="animate-spin"
                      />

                    ) : (

                      <MapPin size={15} />

                    )}

                    Save Assignment

                  </button>

                )}

              </div>


              {kitchens.length === 0 && (

                <div className="
                  mt-3
                  rounded-lg
                  border
                  border-amber-100
                  bg-amber-50
                  px-3
                  py-2
                  text-xs
                  text-amber-700
                ">
                  No active kitchens are available for assignment.
                </div>

              )}

            </div>

          )}


          {/* =================================================
              ACCOUNT STATUS
          ================================================= */}

          <div className="
            mt-5
            rounded-2xl
            border
            border-slate-200
            p-5
          ">

            <div className="
              flex
              flex-col
              gap-4
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

                  {status ? (

                    <CheckCircle2
                      size={17}
                      className="text-emerald-600"
                    />

                  ) : (

                    <UserX
                      size={17}
                      className="text-slate-500"
                    />

                  )}


                  <h3 className="
                    text-sm
                    font-semibold
                    text-slate-900
                  ">
                    Account Status
                  </h3>

                </div>


                <p className="
                  mt-1
                  text-xs
                  text-slate-400
                ">
                  {status
                    ? "This user can sign in and use the system."
                    : "This user cannot sign in while inactive."}
                </p>

              </div>


              {canChangeStatus && (

                <button
                  type="button"
                  onClick={
                    handleStatusUpdate
                  }
                  disabled={
                    actionLoading
                  }
                  className={`
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    px-4
                    text-sm
                    font-semibold
                    transition
                    disabled:cursor-not-allowed
                    disabled:opacity-50

                    ${
                      status
                        ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }
                  `}
                >

                  {actionLoading ? (

                    <Loader2
                      size={15}
                      className="animate-spin"
                    />

                  ) : status ? (

                    <UserX size={15} />

                  ) : (

                    <UserCheck size={15} />

                  )}


                  {status
                    ? "Deactivate User"
                    : "Activate User"}

                </button>

              )}

            </div>

          </div>

        </div>


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="
          flex
          shrink-0
          items-center
          justify-between
          border-t
          border-slate-100
          px-6
          py-4
        ">

          <div className="
            text-[11px]
            text-slate-400
          ">

            User ID:{" "}
            {user.id}

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={actionLoading}
            className="
              h-10
              rounded-xl
              px-4
              text-sm
              font-semibold
              text-slate-600
              transition
              hover:bg-slate-100
              disabled:opacity-50
            "
          >
            Close
          </button>

        </div>

      </div>

    </div>

  );

};


export default UserDetailsModal;