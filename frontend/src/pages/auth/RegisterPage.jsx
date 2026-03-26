import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth.api";
import { Brain } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await registerUser(form);
      // Don't login yet — go to check email page
      navigate("/check-email", { state: { email: form.email } });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--left" />
      <div className="auth-page__glow auth-page__glow--right" />
      <div className="auth-page__wrapper">
        <div className="auth-page__logo">
          <div className="auth-page__logo-icon">
            <Brain />
          </div>
          <h1 className="auth-page__logo-name">LinkMind</h1>
          <p className="auth-page__tagline">
            Your second brain, supercharged by AI
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card__tabs">
            <Link to="/login" className="auth-card__tab">
              Login
            </Link>
            <button className="auth-card__tab auth-card__tab--active">
              Register
            </button>
          </div>

          <form className="auth-card__form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-field__label">FULL NAME</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  className="auth-field__input"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field__label">EMAIL ADDRESS</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  className="auth-field__input"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field__label">PASSWORD</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Min. 6 characters"
                  className="auth-field__input"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-field__eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="auth-card__error">{error}</p>}

            <button
              type="submit"
              className="auth-card__submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-card__submit-loading">
                  <span className="spinner-dot" /> Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="auth-card__footer">
            <span>V 1.0.0 • SECURE_AUTHENTICATION_NODE</span>
          </div>
        </div>

        <div className="auth-page__status">
          <span className="auth-page__status-item auth-page__status-item--online">
            <span className="auth-page__status-dot" />
            CORE SERVICES ONLINE
          </span>
          <span className="auth-page__status-item">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            E2E ENCRYPTED
          </span>
        </div>
      </div>
    </div>
  );
}
