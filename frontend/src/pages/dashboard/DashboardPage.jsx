import { useAuthStore } from "../../store/auth.store";
import StatsBar from "./StatsBar";
import ResurfacingSection from "./ResurfacingSection";
import RecentSaves from "./RecentSaves";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="dashboard__header">
        <h1 className="dashboard__title">Architectural Overview</h1>
        <p className="dashboard__sub">Mapping your intellectual territory</p>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Memory Resurfacing */}
      <ResurfacingSection />

      {/* Recent Saves */}
      <RecentSaves />
    </div>
  );
}