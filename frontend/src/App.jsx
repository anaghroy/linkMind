import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import { useAuthStore } from "./store/auth.store";
import { useThemeStore } from "./store/theme";
import "./styles/main.scss";

function App() {
  const { initAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;