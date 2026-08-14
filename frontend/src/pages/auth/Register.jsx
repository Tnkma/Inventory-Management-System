import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";


const Register = () => {

  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });


  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleChange = (event) => {

    const {
      name,
      value
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,
        [name]: value
      })
    );

  };


  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    if (
      formData.password !==
      formData.confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    if (
      formData.password.length < 8
    ) {

      setError(
        "Password must be at least 8 characters."
      );

      return;
    }


    try {

      setLoading(true);


      await api.post(
        "/auth/register",
        {
          firstName:
            formData.firstName.trim(),

          lastName:
            formData.lastName.trim(),

          email:
            formData.email.trim(),

          phone:
            formData.phone.trim() || null,

          password:
            formData.password
        }
      );


      setSuccess(
        "Account created successfully. Redirecting to login..."
      );


      setTimeout(() => {

        navigate("/login");

      }, 1200);


    } catch (err) {

      console.error(
        "Registration failed:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Unable to create your account."
      );


    } finally {

      setLoading(false);

    }

  };


  return (

    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-slate-100
        px-4
        py-10
      "
    >

      <div className="w-full max-w-lg">

        <div
          className="
            rounded-2xl
            bg-white
            p-8
            shadow-xl
          "
        >

          {/* HEADER */}

          <div className="mb-8 text-center">

            <h1
              className="
                text-3xl
                font-bold
                text-slate-800
              "
            >
              Create Account
            </h1>


            <p
              className="
                mt-2
                text-sm
                text-slate-500
              "
            >
              Register for the restaurant inventory system
            </p>

          </div>


          {/* ERROR */}

          {error && (

            <div
              className="
                mb-5
                rounded-lg
                border
                border-red-100
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>

          )}


          {/* SUCCESS */}

          {success && (

            <div
              className="
                mb-5
                rounded-lg
                border
                border-emerald-100
                bg-emerald-50
                px-4
                py-3
                text-sm
                text-emerald-600
              "
            >
              {success}
            </div>

          )}


          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* NAME */}

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              "
            >

              <div>

                <label
                  htmlFor="firstName"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  First Name
                </label>


                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={
                    formData.firstName
                  }
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:border-slate-500
                    focus:ring-2
                    focus:ring-slate-200
                  "
                />

              </div>


              <div>

                <label
                  htmlFor="lastName"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Last Name
                </label>


                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={
                    formData.lastName
                  }
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:border-slate-500
                    focus:ring-2
                    focus:ring-slate-200
                  "
                />

              </div>

            </div>


            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Email
              </label>


              <input
                id="email"
                name="email"
                type="email"
                value={
                  formData.email
                }
                onChange={handleChange}
                placeholder="john@example.com"
                required
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-slate-500
                  focus:ring-2
                  focus:ring-slate-200
                "
              />

            </div>


            {/* PHONE */}

            <div>

              <label
                htmlFor="phone"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Phone
              </label>


              <input
                id="phone"
                name="phone"
                type="tel"
                value={
                  formData.phone
                }
                onChange={handleChange}
                placeholder="08012345678"
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-slate-500
                  focus:ring-2
                  focus:ring-slate-200
                "
              />

            </div>


            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Password
              </label>


              <input
                id="password"
                name="password"
                type="password"
                value={
                  formData.password
                }
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-slate-500
                  focus:ring-2
                  focus:ring-slate-200
                "
              />

            </div>


            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Confirm Password
              </label>


              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={
                  formData.confirmPassword
                }
                onChange={handleChange}
                placeholder="Repeat your password"
                required
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-slate-500
                  focus:ring-2
                  focus:ring-slate-200
                "
              />

            </div>


            {/* INFO */}

            <div
              className="
                rounded-lg
                bg-slate-50
                px-4
                py-3
                text-xs
                text-slate-500
              "
            >
              New registrations are created as
              <span className="font-semibold text-slate-700">
                {" "}Kitchen Staff
              </span>
              . An administrator can assign you to a kitchen after registration.
            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-lg
                bg-slate-800
                px-4
                py-3
                font-semibold
                text-white
                transition
                hover:bg-slate-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {loading
                ? "Creating account..."
                : "Create Account"
              }

            </button>

          </form>


          {/* LOGIN */}

          <div
            className="
              mt-6
              text-center
              text-sm
              text-slate-500
            "
          >

            Already have an account?

            <Link
              to="/login"
              className="
                ml-1
                font-semibold
                text-slate-800
                hover:underline
              "
            >
              Sign in
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
};


export default Register;