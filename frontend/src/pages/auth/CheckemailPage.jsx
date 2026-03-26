import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api.instance";

export default function CheckEmailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || "your email";

  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    setResendError("");
    try {
      await api.post("/auth/resend-verification", { email });
      setResendMsg("Verification email sent! Check your inbox.");
    } catch (err) {
      setResendError(
        err.response?.data?.message || "Failed to resend. Try again later."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--left" />
      <div className="auth-page__glow auth-page__glow--right" />

      <div className="auth-page__wrapper">
        {/* Logo */}
        <div className="auth-page__logo">
          <div className="auth-page__logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="3" fill="white" />
              <circle cx="14" cy="6" r="2" fill="white" opacity="0.7" />
              <circle cx="14" cy="22" r="2" fill="white" opacity="0.7" />
              <circle cx="6" cy="14" r="2" fill="white" opacity="0.7" />
              <circle cx="22" cy="14" r="2" fill="white" opacity="0.7" />
              <circle cx="8" cy="8" r="1.5" fill="white" opacity="0.4" />
              <circle cx="20" cy="8" r="1.5" fill="white" opacity="0.4" />
              <circle cx="8" cy="20" r="1.5" fill="white" opacity="0.4" />
              <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.4" />
            </svg>
          </div>
          <h1 className="auth-page__logo-name">LinkMind</h1>
        </div>

        {/* Check email card */}
        <div className="verify-card">
          {/* Animated envelope */}
          <div className="verify-card__icon">
            <div className="verify-card__envelope">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <div className="verify-card__envelope-dot" />
            </div>
          </div>

          <h2 className="verify-card__title">Check your inbox</h2>
          <p className="verify-card__desc">
            We've sent a verification link to
          </p>
          <div className="verify-card__email">{email}</div>
          <p className="verify-card__hint">
            Click the link in the email to activate your account and start using LinkMind.
          </p>

          {/* Steps */}
          <div className="verify-card__steps">
            <div className="verify-card__step">
              <span className="verify-card__step-num">1</span>
              <span>Open your email inbox</span>
            </div>
            <div className="verify-card__step">
              <span className="verify-card__step-num">2</span>
              <span>Click the verification link</span>
            </div>
            <div className="verify-card__step">
              <span className="verify-card__step-num">3</span>
              <span>You'll be redirected to LinkMind</span>
            </div>
          </div>

          {/* Resend */}
          <div className="verify-card__resend">
            <p>Didn't receive the email?</p>
            <button
              className="verify-card__resend-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
          </div>

          {resendMsg && (
            <div className="verify-card__msg verify-card__msg--success">
              ✓ {resendMsg}
            </div>
          )}
          {resendError && (
            <div className="verify-card__msg verify-card__msg--error">
              {resendError}
            </div>
          )}

          {/* Back to login */}
          <button
            className="verify-card__back"
            onClick={() => navigate("/login")}
          >
            ← Back to Login
          </button>
        </div>

        <div className="auth-page__status">
          <span className="auth-page__status-item auth-page__status-item--online">
            <span className="auth-page__status-dot" />
            CORE SERVICES ONLINE
          </span>
          <span className="auth-page__status-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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