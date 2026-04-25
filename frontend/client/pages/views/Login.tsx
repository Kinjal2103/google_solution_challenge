import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface LoginViewProps {
  onLogin: () => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onLogin();
      } catch (err: any) {
        alert("Login failed: " + err.message);
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
          <p className="text-sm text-muted-foreground">Coordinator Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage community needs</p>
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coordinator@needbridge.org"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition-colors"
          >
            Sign In
          </Button>

            {/* Demo Credentials Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Demo Credentials:</p>
            
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Coordinator Account:</p>
              <div className="bg-white rounded p-2 space-y-1">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">Email:</span> coordinator@needbridge.org
                </p>
                <p className="text-xs text-foreground">
                  <span className="font-semibold">Password:</span> NeedBridge123!
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Volunteer Accounts:</p>
              <div className="bg-white rounded p-2 space-y-1 text-xs">
                <p className="text-foreground">
                  <span className="font-semibold">Email:</span> aarav.singh@needbridge.org
                </p>
                <p className="text-foreground">
                  <span className="font-semibold">Alt Email:</span> diya.mehta@needbridge.org
                </p>
                <p className="text-foreground">
                  <span className="font-semibold">Password:</span> NeedBridgeVolunteer123!
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
