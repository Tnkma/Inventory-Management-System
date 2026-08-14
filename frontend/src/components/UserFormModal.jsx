import { useEffect, useState } from "react";

import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";

import api from "../services/api";


const UserFormModal = ({
  isOpen,
  onClose,
  onSuccess,
}) => {

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "KITCHEN_STAFF",
  });


  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =========================================================
  // RESET
  // =========================================================

  useEffect(() => {

    if (!isOpen) {
      return;
    }

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      role: "KITCHEN_STAFF",
    });

    setShowPassword(false);
    setError("");

  }, [isOpen]);


  // =========================================================
  // CHANGE
  // =========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

  };


  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {

    if (loading) {
      return;
    }

    setError("");

    onClose();

  };


  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");


    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {

      setError(
        "First name, last name, email and password are required."
      );

      return;
    }


    if (formData.password.length < 8) {

      setError(
        "Password must be at least 8 characters."
      );

      return;
    }


    try {

      setLoading(true);


      await api.post(
        "/users",
        {
          firstName:
            formData.firstName.trim(),

          lastName:
            formData.lastName.trim(),

          email:
            formData.email.trim(),

          password:
            formData.password,

          phone:
            formData.phone.trim() || null,

          role:
            formData.role,
        }
      );


      if (onSuccess) {
        await onSuccess();
      }

    } catch (err) {

      console.error(
        "Failed to create user:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to create user."
      );

    } finally {

      setLoading(false);

    }

  };


  if (!isOpen) {
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
          w-full
          max-w-xl
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

              <UserPlus size={19} />

            </div>


            <div>

              <h2 className="
                text-base
                font-semibold
                text-slate-900
              ">
                Add User
              </h2>


              <p className="
                mt-0.5
                text-xs
                text-slate-500
              ">
                Create a new system user account.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
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
            FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="
            max-h-[75vh]
            overflow-y-auto
            px-6
            py-6
          "
        >

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
              NAME
          ================================================= */}

          <div className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
          ">

            <div>

              <label className="
                mb-2
                block
                text-xs
                font-semibold
                text-slate-700
              ">
                First Name
              </label>


              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                required
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3.5
                  text-sm
                  outline-none
                  transition
                  focus:border-violet-300
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />

            </div>


            <div>

              <label className="
                mb-2
                block
                text-xs
                font-semibold
                text-slate-700
              ">
                Last Name
              </label>


              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                required
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3.5
                  text-sm
                  outline-none
                  transition
                  focus:border-violet-300
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />

            </div>

          </div>


          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="mt-4">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Email
            </label>


            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@restaurant.com"
              autoComplete="email"
              required
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                text-sm
                outline-none
                transition
                focus:border-violet-300
                focus:ring-4
                focus:ring-violet-500/10
              "
            />

          </div>


          {/* =================================================
              PHONE
          ================================================= */}

          <div className="mt-4">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Phone
            </label>


            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+234..."
              autoComplete="tel"
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                px-3.5
                text-sm
                outline-none
                transition
                focus:border-violet-300
                focus:ring-4
                focus:ring-violet-500/10
              "
            />

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="mt-4">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Temporary Password
            </label>


            <div className="relative">

              <input
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                required
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3.5
                  pr-11
                  text-sm
                  outline-none
                  transition
                  focus:border-violet-300
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />


              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                className="
                  absolute
                  right-2
                  top-1/2
                  flex
                  h-7
                  w-7
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-700
                "
              >

                {showPassword
                  ? <EyeOff size={15} />
                  : <Eye size={15} />
                }

              </button>

            </div>

          </div>


          {/* =================================================
              ROLE
          ================================================= */}

          <div className="mt-4">

            <label className="
              mb-2
              block
              text-xs
              font-semibold
              text-slate-700
            ">
              Initial Role
            </label>


            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
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


            <p className="
              mt-1.5
              text-[11px]
              text-slate-400
            ">
              Kitchen assignment is managed separately after the user is created.
            </p>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="
            mt-7
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
              onClick={handleClose}
              disabled={loading}
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
              Cancel
            </button>


            <button
              type="submit"
              disabled={loading}
              className="
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                bg-violet-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-violet-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {loading ? (

                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                  Creating...
                </>

              ) : (

                <>
                  <UserPlus size={15} />

                  Create User
                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

};


export default UserFormModal;