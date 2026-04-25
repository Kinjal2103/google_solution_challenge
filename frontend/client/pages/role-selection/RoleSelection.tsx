import { Button } from "@/components/ui/button";
import { Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface RoleSelectionProps {
  onSelectRole: (role: "coordinator" | "volunteer") => void;
}

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-lg mb-4">
            <span className="text-5xl">🌱</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">NeedBridge</h1>
          <p className="text-lg text-muted-foreground">Connecting Communities with Support</p>
        </div>

        <div className="flex justify-center mb-10">
          <Link to="/report" className="w-full max-w-2xl">
            <Button
              variant="secondary"
              className="w-full h-12 text-base font-semibold"
            >
              Report an Emergency (Public)
            </Button>
          </Link>
        </div>

        {/* Demo Credentials Badge */}
        <div className="max-w-2xl mx-auto mb-10 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-3">📌 Demo Credentials:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-blue-800 mb-1">Coordinator:</p>
              <p className="text-xs text-blue-700 font-mono bg-white rounded p-2">coordinator@needbridge.org</p>
              <p className="text-xs text-blue-700 font-mono bg-white rounded p-2 mt-1">NeedBridge123!</p>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-800 mb-1">Volunteer (Examples):</p>
              <p className="text-xs text-blue-700 font-mono bg-white rounded p-2">aarav.singh@needbridge.org</p>
              <p className="text-xs text-blue-700 font-mono bg-white rounded p-2 mt-1">NeedBridgeVolunteer123!</p>
            </div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Coordinator Card */}
          <button
            onClick={() => onSelectRole("coordinator")}
            className="bg-white rounded-lg border-2 border-border p-8 shadow-lg hover:shadow-xl transition-all hover:border-primary cursor-pointer group"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Coordinator</h2>
            <p className="text-muted-foreground mb-6">
              Manage community needs, coordinate volunteers, and track assignments
            </p>
            <div className="space-y-2 mb-8 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                View and manage all community needs
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Match volunteers to assignments
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Track progress and completion
              </p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Continue as Coordinator
            </Button>
          </button>

          {/* Volunteer Card */}
          <button
            onClick={() => onSelectRole("volunteer")}
            className="bg-white rounded-lg border-2 border-border p-8 shadow-lg hover:shadow-xl transition-all hover:border-primary cursor-pointer group"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Heart className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Volunteer</h2>
            <p className="text-muted-foreground mb-6">
              Help your community by responding to needs and making a real impact
            </p>
            <div className="space-y-2 mb-8 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Browse community needs
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Track your assignments
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Build your volunteer profile
              </p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Continue as Volunteer
            </Button>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Prototype Demo - See credentials above to explore all features
        </p>
      </div>
    </div>
  );
}
