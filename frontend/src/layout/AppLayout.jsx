import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import Navbar from "../layout/Navbar";
import QuickSave from "../components/items/QuickSave";

export default function AppLayout() {
  const { pathname } = useLocation();
  const isGraph = pathname === "/graph";

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <Navbar />
        <main
          className={`app-layout__content${isGraph ? " app-layout__content--fullscreen" : ""}`}
        >
          <Outlet />
        </main>
      </div>
      <QuickSave />
    </div>
  );
}
