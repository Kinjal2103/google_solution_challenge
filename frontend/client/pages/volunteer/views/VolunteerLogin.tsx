import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface VolunteerLoginProps {
  onLogin: () => void;
}

export default function VolunteerLogin({ onLogin }: VolunteerLoginProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "join">("signin");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [organizations, setOrganizations] = useState<Array<{ id: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  
  const [joinData, setJoinData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    skillsText: "",
    availability: "Both",
    location: "",
    organizationId: "",
  });

  useEffect(() => {
    if (activeTab !== "join") return;

    const loadOrgs = async () => {
      setLoadingOrgs(true);
      try {
        const { data: orgs, error } = await supabase
          .from("organizations")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(25);

        if (error) throw error;
        const nextOrgs = (orgs ?? []) as Array<{ id: string }>;
        setOrganizations(nextOrgs);
        setJoinData((prev) => ({
          ...prev,
          organizationId: prev.organizationId || nextOrgs[0]?.id || "",
        }));
      } catch (err: any) {
        console.error("Failed to load organizations", err);
        setOrganizations([]);
      } finally {
        setLoadingOrgs(false);
      }
    };

    void loadOrgs();
  }, [activeTab]);

  const parsedSkills = useMemo(() => {
    const parts = joinData.skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(parts));
  }, [joinData.skillsText]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signInEmail && signInPassword) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: signInEmail,
          password: signInPassword
        });
        if (error) throw error;
        onLogin();
      } catch (err: any) {
        alert("Volunteer login failed: " + err.message);
      }
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinData.fullName && joinData.email && joinData.password && parsedSkills.length > 0) {
      try {
        if (!joinData.organizationId) {
          throw new Error("No organization selected. Please try again.");
        }

        // Sign up user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: joinData.email,
          password: joinData.password,
        });
        if (authError) throw authError;

        // Insert into volunteers table with organization
        if (authData?.user) {
          const payload: Record<string, unknown> = {
             id: authData.user.id,
             organization_id: joinData.organizationId,
             full_name: joinData.fullName,
             phone: joinData.phone,
             email: joinData.email,
             skills: parsedSkills,
             zone: joinData.location || null,
             active: true,
          };

          const { error: insertError } = await supabase
            .from("volunteers")
            .insert([payload]);
          if (insertError) throw insertError;
        }

        alert("Registered successfully! You can now sign in.");
        onLogin();
      } catch (err: any) {
        alert("Volunteer registration failed: " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* Brand Block */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4">
            <span className="text-3xl font-bold text-white">🌱</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">NeedBridge</h2>
          <p className="text-sm text-muted-foreground">Make a difference in your community</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-2 px-4 rounded-md transition-all text-sm font-medium ${
              activeTab === "signin"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-2 px-4 rounded-md transition-all text-sm font-medium ${
              activeTab === "join"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Join as Volunteer
          </button>
        </div>

        {/* Sign In Form */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your volunteer account</p>
            </div>

            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="signin-email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                required
              />
            </div>

            <div>
              <label htmlFor="signin-password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                id="signin-password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Sign In
            </Button>

            <div className="text-center">
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>
          </form>
        )}

        {/* Join Form */}
        {activeTab === "join" && (
          <form onSubmit={handleJoin} className="space-y-6 max-h-96 overflow-y-auto">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Join as Volunteer</h1>
              <p className="text-sm text-muted-foreground">Help your community make a difference</p>
            </div>

            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullname"
                value={joinData.fullName}
                onChange={(e) => setJoinData({ ...joinData, fullName: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={joinData.phone}
                onChange={(e) => setJoinData({ ...joinData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              />
            </div>

            <div>
              <label htmlFor="join-email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="join-email"
                value={joinData.email}
                onChange={(e) => setJoinData({ ...joinData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                required
              />
            </div>

            <div>
              <label htmlFor="join-password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                id="join-password"
                value={joinData.password}
                onChange={(e) => setJoinData({ ...joinData, password: e.target.value })}
                placeholder="Create a password"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Organization</label>
              <select
                value={joinData.organizationId}
                onChange={(e) => setJoinData({ ...joinData, organizationId: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                disabled={loadingOrgs || organizations.length === 0}
                required
              >
                {organizations.length === 0 ? (
                  <option value="">
                    {loadingOrgs ? "Loading organizations..." : "No organizations available"}
                  </option>
                ) : (
                  organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.id}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                If you don’t see your org, ask a coordinator to create it first.
              </p>
            </div>

            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-foreground mb-2">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                id="skills"
                value={joinData.skillsText}
                onChange={(e) => setJoinData({ ...joinData, skillsText: e.target.value })}
                placeholder="e.g. medical, logistics, translation"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                required
              />
            </div>

            <div>
              <label htmlFor="availability" className="block text-sm font-medium text-foreground mb-2">
                Availability
              </label>
              <select
                id="availability"
                value={joinData.availability}
                onChange={(e) => setJoinData({ ...joinData, availability: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              >
                <option value="Weekdays">Weekdays</option>
                <option value="Weekends">Weekends</option>
                <option value="Both">Both</option>
                <option value="On-Call">On-Call</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={joinData.location}
                onChange={(e) => setJoinData({ ...joinData, location: e.target.value })}
                placeholder="Your city or address"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Join as Volunteer
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your account will be live after coordinator approval
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
