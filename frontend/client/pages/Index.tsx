import { useState } from "react";
import RoleSelection from "./role-selection/RoleSelection";
import CoordinatorDashboard from "./coordinator/CoordinatorDashboard";
import VolunteerDashboard from "./volunteer/VolunteerDashboard";

type Role = "coordinator" | "volunteer" | null;

export default function Index() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setIsLoggedIn(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedRole(null);
  };

  // Show role selection if no role selected yet
  if (!selectedRole) {
    return <RoleSelection onSelectRole={handleRoleSelect} />;
  }

  // Show coordinator dashboard
  if (selectedRole === "coordinator" && isLoggedIn) {
    return <CoordinatorDashboard onLogout={handleLogout} />;
  }

  // Show volunteer dashboard
  if (selectedRole === "volunteer" && isLoggedIn) {
    return <VolunteerDashboard onLogout={handleLogout} />;
  }

  // Show login based on selected role
  if (selectedRole === "coordinator") {
    return (
      <div>
        {/* Coordinator login will be shown by CoordinatorDashboard */}
        <CoordinatorDashboard onLogout={() => handleRoleSelect(null)} isLoginView onLogin={handleLogin} />
      </div>
    );
  }

  if (selectedRole === "volunteer") {
    return (
      <div>
        {/* Volunteer login will be shown by VolunteerDashboard */}
        <VolunteerDashboard onLogout={() => handleRoleSelect(null)} isLoginView onLogin={handleLogin} />
      </div>
    );
  }

  return null;
}
