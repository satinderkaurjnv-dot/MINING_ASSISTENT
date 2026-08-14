"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminRegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!username || !email || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Registration failed."
        );
      }

      setMessage(
        data.message ||
          "Registration submitted successfully."
      );

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="registration-page">

      {/* Background decorative elements */}
      <div className="contour contour-one" />
      <div className="contour contour-two" />
      <div className="contour contour-three" />

      <div className="mine-decoration">
        <div className="mine-excavator">
          ⚒
        </div>
      </div>

      {/* =====================================================
          LOGO
      ===================================================== */}

 <div className="registration-brand">
  <img
    src="/images/mining_logo.png"
    alt="Mining Discovery"
  />
</div>
      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="registration-card">

        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <section className="registration-visual">

          <div className="mine-image-overlay" />

          <div className="visual-content">

            {/*<div className="gold-line" />

            <h2>
              Building the Future
              <span>
                Through Discovery
              </span>
            </h2>

            <p>
              Join Mining Discovery and be a part
              of a smarter, safer, and more
              sustainable mining world.
            </p>
*/}
          </div>

        </section>


        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <section className="registration-form-panel">

          <div className="form-content">

            {/* Shield icon */}

            <div className="registration-icon">
              <span>♛</span>
            </div>


            <h1>
              Super Admin
              <span>Registration</span>
            </h1>

            <div className="title-line" />

            <p className="form-subtitle">
              Create your super admin account
              to get started
            </p>


            {/* =================================================
                FORM
            ================================================= */}

            <form onSubmit={handleSubmit}>

              {/* Username */}

              <div className="input-wrapper">

                <span className="input-icon">
                  ♙
                </span>

                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  autoComplete="username"
                />

              </div>


              {/* Email */}

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                />

              </div>


              {/* Password */}

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>

              </div>


              {/* Confirm password */}

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? "◉" : "◌"}
                </button>

              </div>


              {/* Error */}

              {error && (
                <div className="registration-error">
                  {error}
                </div>
              )}


              {/* Success */}

              {message && (
                <div className="registration-success">
                  {message}
                </div>
              )}


              {/* Submit */}

              <button
                type="submit"
                className="register-button"
                disabled={loading}
              >

                <span className="button-shield">
                  ♛
                </span>

                {loading
                  ? "Creating Account..."
                  : "Register Super Admin"}

              </button>

            </form>


            {/* =================================================
                OR
            ================================================= */}

            <div className="or-divider">

              <span />

              <strong>OR</strong>

              <span />

            </div>


            {/* Back to login */}

            <Link
              href="/admin-login"
              className="back-login-button"
            >
              <span>←</span>
              Back to Login
            </Link>


            {/* Access notice */}

            

          </div>

        </section>

      </div>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="registration-footer">

        <span className="footer-lock">
          🔒
        </span>

        <span>
          Secure Registration
        </span>

        <i>•</i>

        <span>
          Protected by Mining Discovery
        </span>

      </div>

    </main>
  );
}