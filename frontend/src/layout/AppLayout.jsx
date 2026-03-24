import { Outlet } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import Navbar from "../layout/Navbar";
import QuickSave from "../components/items/QuickSave";

export default function AppLayout() {
  return (
    <div className="app-layout">
      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="app-layout__main">
        <Navbar />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>

      {/* Global Cmd+K quick save modal */}
      <QuickSave />
    </div>
  );
}