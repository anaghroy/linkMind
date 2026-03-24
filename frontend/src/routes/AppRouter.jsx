import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Auth pages
import LoginPage from "../pages/auth/loginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// App pages
import DashboardPage from "../pages/dashboard/DashboardPage";
import LibraryPage from "../pages/library/LibraryPage";
import ItemDetailPage from "../pages/ItemDetail/ItemDetailPage";
import CollectionsPage from "../pages/collections/CollectionsPage";
import CollectionDetail from "../pages/collections/CollectionDetail";
import SearchPage from "../pages/Search/SearchPage";
import GraphPage from "../pages/Graph/GraphPage";
import SettingsPage from "../pages/Settings/SettingsPage";

// Layout
import AppLayout from "../layout/AppLayout";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — wrapped in AppLayout (sidebar + navbar) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<ItemDetailPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<CollectionDetail />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}