import { useEffect, useMemo, useState } from "react";
import { LogOut, Bell, User, ChevronDown } from "lucide-react";

import VolunteerLogin from "./views/VolunteerLogin";
import VolunteerHome from "./views/VolunteerHome";
import BrowseNeeds from "./views/BrowseNeeds";
import MyAssignments from "./views/MyAssignments";
import MyProfile from "./views/MyProfile";
import Notifications from "./views/Notifications";
import { supabase } from "@/lib/supabase";
import { fetchVolunteerProfile } from "@/lib/api";

type ViewType = "home" | "browse-needs" | "assignments" | "profile" | "notifications";

interface VolunteerDashboardProps {
  onLogout: () => void;
  isLoginView?: boolean;
  onLogin?: () => void;
}

export default function VolunteerDashboard({
  onLogout,
  isLoginView = false,
  onLogin,
}: VolunteerDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(!isLoginView);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileName, setProfileName] = useState("Volunteer");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfileName("Volunteer");
        return;
      }

      const profile = await fetchVolunteerProfile(user.id);
      setProfileName(
        profile?.full_name ||
          (user.user_metadata?.full_name as string | undefined) ||
          user.email?.split("@")[0] ||
          "Volunteer",
      );
    };

    if (isLoggedIn) {
      void loadProfile();
    }
  }, [isLoggedIn]);

  const initials = useMemo(
    () =>
      profileName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join(""),
    [profileName],
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView("home");
    if (onLogin) onLogin();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    onLogout();
  };

  const navItems = [
    { id: "home", label: "Home", view: "home" as ViewType },
    { id: "browse", label: "Browse Needs", view: "browse-needs" as ViewType },
    { id: "assignments", label: "My Assignments", view: "assignments" as ViewType },
    { id: "profile", label: "Profile", view: "profile" as ViewType },
  ];

  if (!isLoggedIn) {
    return <VolunteerLogin onLogin={handleLogin} />;
  }

  const handleNotificationsView = () => {
    setCurrentView("notifications");
    setUnreadNotifications(0);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-white">🌱</span>
            </div>
            <span className="text-xl font-bold text-foreground">NeedBridge</span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden sm:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.view)}
                className={`text-sm font-medium transition-colors ${
                  currentView === item.view
                    ? "text-primary border-b-2 border-primary pb-4"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side: Notifications & Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <button
              onClick={handleNotificationsView}
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {initials}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-border shadow-lg z-50">
                  <button
                    onClick={() => {
                      setCurrentView("profile");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm text-foreground flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 transition-colors text-sm text-red-600 flex items-center gap-2 border-t border-border"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto w-full">
          {currentView === "home" && <VolunteerHome onBrowseNeeds={() => setCurrentView("browse-needs")} />}
          {currentView === "browse-needs" && <BrowseNeeds />}
          {currentView === "assignments" && <MyAssignments />}
          {currentView === "profile" && <MyProfile />}
          {currentView === "notifications" && <Notifications onUnreadChange={setUnreadNotifications} />}
        </div>
      </main>
    </div>
  );
}
