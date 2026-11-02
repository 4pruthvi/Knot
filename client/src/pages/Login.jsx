
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginUser } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const successMessage = location.state?.message;

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(formData);

      // Save authentication details
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Navigate to chat application
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#11112e] p-3 sm:p-6">
      <div className="relative flex min-h-[570px] w-full max-w-[1200px] flex-col overflow-hidden rounded-[28px] bg-[#f6f4ff] shadow-2xl lg:min-h-[560px] lg:flex-row">

        {/* LEFT BRANDING SECTION */}
        <section className="relative flex min-h-[430px] w-full flex-col overflow-hidden bg-gradient-to-br from-[#fbfaff] via-[#f5f1ff] to-[#e8e1ff] px-7 pb-0 pt-7 sm:px-10 lg:min-h-[560px] lg:w-[56%] lg:px-12 lg:pt-9">

          {/* Background decorations */}
          <div className="pointer-events-none absolute -left-20 bottom-[-170px] h-[300px] w-[550px] rounded-[50%] bg-gradient-to-r from-[#e7e0ff] to-[#d7caff] opacity-80" />

          <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />

          {/* KNOT logo */}
          <div className="relative z-10">
            <img
              src="/knot-wordmark-reference.png"
              alt="KNOT"
              className="h-auto w-[150px] object-contain sm:w-[165px]"
            />
          </div>

          {/* Branding content */}
          <div className="relative z-10 mt-8 max-w-[300px] sm:mt-10 lg:mt-10">
            <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-[#11163d] sm:text-4xl">
              People.
              <br />
              Messages.
              <br />
              <span className="bg-gradient-to-r from-[#6c35ed] to-[#a12df1] bg-clip-text text-transparent">
                Together.
              </span>
            </h1>

            <p className="mt-5 max-w-[290px] text-sm leading-6 text-[#30365b] sm:text-[15px]">
              A simple chat app to keep you close <br/> to friends, family and your
              team.
            </p>
          </div>

          {/* Illustration */}
          <div className="relative z-10 mt-auto flex min-h-[220px] flex-1 items-end justify-center lg:absolute lg:bottom-24 lg:right-2 lg:h-[360px] lg:w-[68%] lg:flex-none">
            <img
              src="/knot-register-illustration.png"
              alt="Person chatting on a laptop"
              className="h-auto max-h-[330px] w-full max-w-[390px] object-contain object-bottom"
            />
          </div>
        </section>

        {/* RIGHT LOGIN SECTION */}
        <section className="relative z-20 flex w-full flex-1 items-center justify-center rounded-t-[28px] bg-white px-6 py-10 shadow-[0_-8px_35px_rgba(57,35,125,0.08)] sm:px-10 lg:min-h-[560px] lg:w-[44%] lg:flex-none lg:rounded-l-[32px] lg:rounded-tr-[28px] lg:px-10 lg:py-12 lg:shadow-[-12px_0_35px_rgba(57,35,125,0.08)] xl:px-12">

          <div className="w-full max-w-[390px]">

            {/* Heading */}
            <div className="mb-9 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#111638]">
                Welcome back
              </h2>

              <p className="mt-3 text-sm text-[#777b9b] sm:text-base">
                Log in to your KNOT account.
              </p>
            </div>

            {/* Success message */}
            {successMessage && (
              <p
                role="status"
                className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {successMessage}
              </p>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>

                <div className="flex items-center rounded-xl border border-[#dedcf1] bg-[#fdfcff] transition-all duration-200 focus-within:border-[#8b4cf2] focus-within:ring-2 focus-within:ring-purple-100">
                  <Mail
                    size={19}
                    className="ml-4 shrink-0 text-[#41466d]"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl bg-transparent px-4 py-3.5 text-sm text-slate-800 outline-none placeholder:text-[#45496c]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>

                <div className="flex items-center rounded-xl border border-[#dedcf1] bg-[#fdfcff] transition-all duration-200 focus-within:border-[#8b4cf2] focus-within:ring-2 focus-within:ring-purple-100">
                  <LockKeyhole
                    size={19}
                    className="ml-4 shrink-0 text-[#41466d]"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    className="w-full min-w-0 bg-transparent px-4 py-3.5 text-sm text-slate-800 outline-none placeholder:text-[#45496c]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="mr-4 shrink-0 text-[#41466d] transition hover:text-purple-600"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              {/* Sign in button */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-3 w-full rounded-xl bg-gradient-to-r from-[#7629ec] to-[#8529e9] py-4 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-8 text-center text-sm text-[#42466b]">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-[#6729e9] transition hover:text-purple-500"
              >
                Create Account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
