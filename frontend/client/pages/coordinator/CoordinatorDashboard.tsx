import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginView from "../views/Login";
import OverviewView from "../views/Overview";
import NeedsBoardView from "../views/NeedsBoard";
import HeatmapView from "../views/Heatmap";
import VolunteerMatchingView from "../views/VolunteerMatching";
import AssignmentStatusView from "../views/AssignmentStatus";

type ViewType = 
  | "overview" 
  | "needs-board" 
  | "heatmap" 
  | "volunteer-matching" 
  | "assignment-status";

type SelectedNeed = {
  id: string;
  title: string;
  category: string;
} | null;

interface CoordinatorDashboardProps {
  onLogout: () => void;
  isLoginView?: boolean;
  onLogin?: () => void;
}

export default function CoordinatorDashboard({ 
  onLogout, 
  isLoginView = false, 
  onLogin 
}: CoordinatorDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [isLoggedIn, setIsLoggedIn] = useState(!isLoginView);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState<SelectedNeed>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView("overview");
    if (onLogin) onLogin();
  };

  const handleLogoutClick = () => {
    setIsLoggedIn(false);
    setSelectedNeed(null);
    onLogout();
  };

  const navigateTo = (view: string, need?: SelectedNeed) => {
    setCurrentView(view as ViewType);
    if (need) {
      setSelectedNeed(need);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", view: "overview" as ViewType },
    { id: "needs-board", label: "Needs Board", view: "needs-board" as ViewType, badge: 12 },
    { id: "heatmap", label: "Heatmap", view: "heatmap" as ViewType },
    { id: "volunteer", label: "Volunteer Matching", view: "volunteer-matching" as ViewType },
    { id: "assignments", label: "Assignment Status", view: "assignment-status" as ViewType },
  ];

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-20"} bg-primary transition-all duration-300 flex flex-col fixed h-screen`}>
        {/* Brand Block */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-bold text-sidebar-accent-foreground">NB</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-bold text-sidebar-foreground text-sm">NeedBridge</p>
                <p className="text-xs text-sidebar-foreground/70">Coordinator</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigateTo(item.view)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    currentView === item.view
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-primary/50"
                  }`}
                >
                  <span className="flex-1 text-left text-sm font-medium">{sidebarOpen ? item.label : item.label.charAt(0)}</span>
                  {item.badge && sidebarOpen && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          {sidebarOpen && (
            <div className="px-2 py-2">
              <p className="text-xs text-sidebar-foreground/70">Logged in as</p>
              <p className="font-medium text-sidebar-foreground text-sm truncate">Tanya Admin</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sidebar-foreground border-sidebar-border hover:bg-sidebar-primary/50"
            onClick={handleLogoutClick}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`${sidebarOpen ? "ml-56" : "ml-20"} flex-1 flex flex-col transition-all duration-300`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                {currentView === "overview" && "Overview"}
                {currentView === "needs-board" && "Needs Board"}
                {currentView === "heatmap" && "Heatmap"}
                {currentView === "volunteer-matching" && "Volunteer Matching"}
                {currentView === "assignment-status" && "Assignment Status"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 bg-green-50 text-status-low text-xs font-semibold rounded-full border border-green-200">
                ● Live Updates
              </div>
              <div className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                24 Active
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentView === "overview" && <OverviewView onNeedSelect={navigateTo} />}
            {currentView === "needs-board" && <NeedsBoardView onNeedSelect={navigateTo} />}
            {currentView === "heatmap" && <HeatmapView />}
            {currentView === "volunteer-matching" && <VolunteerMatchingView selectedNeed={selectedNeed} />}
            {currentView === "assignment-status" && <AssignmentStatusView />}
          </div>
        </main>
      </div>
    </div>
  );
}
