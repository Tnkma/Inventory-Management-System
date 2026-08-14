import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";


const Login = () => {

  const navigate = useNavigate();

  const { login } = useAuth();


  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });


  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // =========================================================
  // HANDLE CHANGE
  // =========================================================

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


  // =========================================================
  // HANDLE LOGIN
  // =========================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");
    setLoading(true);


    try {

      const response =
        await api.post(
          "/auth/login",
          {
            email:
              formData.email.trim(),

            password:
              formData.password
          }
        );


      const {
        token,
        user
      } =
        response.data.data;


      // -----------------------------------------------------
      // Store complete authenticated user
      // -----------------------------------------------------

      login(
        user,
        token
      );


      // -----------------------------------------------------
      // Role-based destination
      // -----------------------------------------------------

      const role =
        String(
          user?.role || ""
        ).toUpperCase();


      switch (role) {

        case "ADMIN":
        case "MANAGER":
        case "STORE_KEEPER":
          navigate("/dashboard");
          break;


        case "KITCHEN_STAFF":

          // Kitchen staff will eventually
          // have their own role-specific dashboard.
          navigate("/dashboard");
          break;


        default:
          navigate("/dashboard");
          break;

      }


    } catch (error) {

      console.error(
        "Login failed:",
        error
      );


      setError(
        error.response?.data?.message ||
        "Unable to login. Please check your credentials."
      );


    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-slate-100
        px-4
      "
    >

      <div className="w-full max-w-md">

        <div
          className="
            rounded-2xl
            bg-white
            p-8
            shadow-xl
          "
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8 text-center">

            <h1
              className="
                text-3xl
                font-bold
                text-slate-800
              "
            >
              Restaurant Inventory
            </h1>


            <p
              className="
                mt-2
                text-sm
                text-slate-500
              "
            >
              Sign in to manage restaurant inventory
            </p>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

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


          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

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
                placeholder="admin@restaurant.com"
                autoComplete="email"
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
                placeholder="Enter your password"
                autoComplete="current-password"
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
                ? "Signing in..."
                : "Sign In"
              }

            </button>

          </form>


          {/* =================================================
              REGISTRATION
          ================================================= */}

          <div
            className="
              mt-6
              text-center
              text-sm
              text-slate-500
            "
          >

            Don't have an account?

            <Link
              to="/register"
              className="
                ml-1
                font-semibold
                text-slate-800
                hover:underline
              "
            >
              Create an account
            </Link>

          </div>

        </div>

      </div>

    </div>

  );

};


export default Login;