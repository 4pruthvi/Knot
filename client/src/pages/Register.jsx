import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, Mail, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { registerUser } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      await registerUser(formData);

      navigate("/login", {
        state: {
          message: "Account created successfully. Please log in.",
        },
      });
    } catch (err) {
      setError(err.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#11112e] p-3 sm:p-6">
      <div className="relative flex min-h-[570px] w-full max-w-[1200px] flex-col overflow-hidden rounded-[28px] bg-[#f6f4ff] shadow-2xl lg:min-h-[560px] lg:flex-row">
        {/* LEFT BRANDING SECTION */}
        <section className="relative flex min-h-[430px] w-full flex-col overflow-hidden bg-gradient-to-br from-[#fbfaff] via-[#f5f1ff] to-[#e8e1ff] px-7 pb-0 pt-7 sm:px-10 lg:min-h-[560px] lg:w-[56%] lg:px-12 lg:pt-9">
          {/* Decorative background circles */}
          <div className="pointer-events-none absolute -left-20 bottom-[-170px] h-[300px] w-[550px] rounded-[50%] bg-gradient-to-r from-[#e7e0ff] to-[#d7caff] opacity-80" />

          <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />

          {/* Logo */}
          <div className="relative z-10">
            <img
              src="/knot-wordmark-reference.png"
              alt="KNOT"
              className="h-auto w-[150px] object-contain sm:w-[165px]"
            />
          </div>

          {/* Main branding content */}
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

            <p className="mt-5 max-w-[250px] text-sm leading-6 text-[#30365b] sm:text-[15px]">
              A simple chat app to keep you close to friends, family and your
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

        {/* RIGHT REGISTRATION SECTION */}
        <section className="relative z-20 flex w-full flex-1 items-center justify-center rounded-t-[28px] bg-white px-6 py-10 shadow-[0_-8px_35px_rgba(57,35,125,0.08)] sm:px-10 lg:min-h-[560px] lg:w-[44%] lg:flex-none lg:rounded-l-[32px] lg:rounded-tr-[28px] lg:px-10 lg:py-12 lg:shadow-[-12px_0_35px_rgba(57,35,125,0.08)] xl:px-12">
          <div className="w-full max-w-[390px]">
            {/* Heading */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[#111638]">
                Create your account
              </h2>

              <p className="mt-2 text-xs text-[#777b9b] sm:text-sm">
                Join KNOT and start chatting instantly.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="sr-only">
                  Full name
                </label>

                <div className="flex items-center rounded-xl border border-[#dedcf1] bg-[#fdfcff] transition-all duration-200 focus-within:border-[#8b4cf2] focus-within:ring-2 focus-within:ring-purple-100">
                  <UserRound
                    size={17}
                    className="ml-3 shrink-0 text-[#41466d]"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    autoComplete="name"
                    required
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-[#171b3e] outline-none placeholder:text-[#45496c]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>

                <div className="flex items-center rounded-xl border border-[#dedcf1] bg-[#fdfcff] transition-all duration-200 focus-within:border-[#8b4cf2] focus-within:ring-2 focus-within:ring-purple-100">
                  <Mail size={17} className="ml-3 shrink-0 text-[#41466d]" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    autoComplete="email"
                    required
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-[#171b3e] outline-none placeholder:text-[#45496c]"
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
                    size={17}
                    className="ml-3 shrink-0 text-[#41466d]"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-[#171b3e] outline-none placeholder:text-[#45496c]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="mr-3 shrink-0 text-[#41466d] transition hover:text-purple-600"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#7629ec] to-[#8529e9] py-3 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-xs text-[#42466b] sm:text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-[#6729e9] transition hover:text-purple-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
