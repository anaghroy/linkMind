import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { loginUser, registerUser, logoutUser } from "../api/auth.api";
import { useUIStore } from "../store/ui.store";

export function useAuth() {
  const navigate = useNavigate();
  const { setAuth, logout, user, isLoggedIn } = useAuthStore();
  const { toastSuccess, toastError } = useUIStore();

  const login = async (credentials) => {
    try {
      const res = await loginUser(credentials);
      setAuth(res.token, res.user);
      toastSuccess("Welcome back!");
      navigate("/dashboard");
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      toastError(message);
      return { success: false, error: message };
    }
  };

  const register = async (data) => {
    try {
      const res = await registerUser(data);
      setAuth(res.token, res.user);
      toastSuccess("Account created!");
      navigate("/dashboard");
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      toastError(message);
      return { success: false, error: message };
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    } finally {
      logout();
      navigate("/login");
    }
  };

  return { login, register, logout: handleLogout, user, isLoggedIn };
}