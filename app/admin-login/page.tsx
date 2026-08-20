"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Invalid username or password"
        );
      }

      window.location.href = "/admin";
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="login-background-grid" />

      <div className="login-container">

        {/* LEFT BRAND PANEL */}
        <section className="login-brand-panel">

          <div className="brand-top">
  <img
    src="/images/mining_logo.png"
    alt="Mining Discovery"
    className="login-mining-logo"
  />
</div>

          <div className="brand-content">

            <div className="brand-label">
              ADMIN PORTAL
            </div>

            <h1>
              Mining intelligence,
              <br />
              <span>managed smarter.</span>
            </h1>

            <p>
              Secure access to the Mining Discovery administration
              platform, conversations, registrations and AI system
              controls.
            </p>

            <div className="brand-features">

              <div className="brand-feature">
                <div className="feature-icon">✦</div>
                <div>
                  <strong>AI Assistant</strong>
                  <span>Monitor the mining AI platform</span>
                </div>
              </div>

              <div className="brand-feature">
                <div className="feature-icon">◫</div>
                <div>
                  <strong>Conversations</strong>
                  <span>Review client conversations</span>
                </div>
              </div>

              <div className="brand-feature">
                <div className="feature-icon">♙</div>
                <div>
                  <strong>User Management</strong>
                  <span>Approve registration requests</span>
                </div>
              </div>

            </div>

          </div>

          <div className="brand-footer">
            <span>MINING DISCOVERY</span>
            <span>•</span>
            <span>ADMIN SYSTEM</span>
          </div>

        </section>


        {/* LOGIN PANEL */}
        <section className="login-form-panel">

          <div className="login-form-wrapper">

            <div className="mobile-logo">
              <div className="brand-mark">
                MD
              </div>
            </div>

            <div className="login-heading">

              <div className="login-badge">
                <span>●</span>
                Secure Admin Access
              </div>

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to access your administration dashboard.
              </p>

            </div>


            <form
              onSubmit={handleLogin}
              className="login-form"
            >

              {/* USERNAME */}

              <div className="form-group">

                <label htmlFor="username">
                  Username
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ◉
                  </span>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div className="form-group">

                <div className="label-row">

                  <label htmlFor="password">
                    Password
                  </label>

                  <span className="secure-label">
                    Secure login
                  </span>

                </div>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ◆
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
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

              </div>


              {/* ERROR */}

              {error && (

                <div className="login-error">

                  <span className="error-icon">
                    !
                  </span>

                  <span>
                    {error}
                  </span>

                </div>

              )}


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="button-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to Admin
                    <span className="button-arrow">
                      →
                    </span>
                  </>
                )}

              </button>

              <div className="register-link">
  <span>Don't have an admin account?</span>

  <Link href="/admin-register">
         Register 
  </Link>
</div>

            </form>


            <div className="login-security">

              <span className="security-icon">
                ✓
              </span>

              <div>
                <strong>Protected administration area</strong>
                <span>
                  Authorized users only
                </span>
              </div>

            </div>


            <div className="login-bottom">

              <span>
                © 2026 Mining Discovery
              </span>

              <span>
                Admin Portal
              </span>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}