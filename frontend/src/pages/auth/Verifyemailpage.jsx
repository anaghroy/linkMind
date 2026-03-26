import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import api from "../../api/api.instance";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await api.get(`/auth/verify-email/${token}`);
      // If backend returns token + user on verify, log them in automatically
      if (res.data.token && res.data.user) {
        setAuth(res.data.token, res.data.user);
      }
      setStatus("success");
      setMessage(res.data.message || "Email verified successfully!");
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.message ||
        "This verification link is invalid or has expired."
      );
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

        <div className="verify-card">
          {/* Loading */}
          {status === "loading" && (
            <>
              <div className="verify-card__icon">
                <div className="verify-card__spinner" />
              </div>
              <h2 className="verify-card__title">Verifying your email...</h2>
              <p className="verify-card__desc">Please wait a moment.</p>
            </>
          )}

          {/* Success */}
          {status === "success" && (
            <>
              <div className="verify-card__icon verify-card__icon--success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                  stroke="var(--accent-green)" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="verify-card__title">Email Verified!</h2>
              <p className="verify-card__desc">{message}</p>
              <p className="verify-card__hint">
                Your account is now active. You can start using LinkMind.
              </p>
              <button
                className="verify-card__cta"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard →
              </button>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div className="verify-card__icon verify-card__icon--error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                  stroke="var(--accent-red)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="verify-card__title">Verification Failed</h2>
              <p className="verify-card__desc">{message}</p>
              <p className="verify-card__hint">
                The link may have expired or already been used.
              </p>
              <div className="verify-card__error-actions">
                <button
                  className="verify-card__cta verify-card__cta--outline"
                  onClick={() => navigate("/register")}
                >
                  Register Again
                </button>
                <button
                  className="verify-card__cta"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
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