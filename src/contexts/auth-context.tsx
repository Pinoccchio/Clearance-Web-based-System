"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, Profile, signIn as supabaseSignIn, signOut as supabaseSignOut, getCurrentProfile, getProfileById } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!profile;

  // Fetch user profile from database
  const refreshProfile = useCallback(async () => {
    try {
      const userProfile = await getCurrentProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> => {
    try {
      console.log("[Auth] Attempting login for:", email);
      const { user: authUser } = await supabaseSignIn({ email, password });

      if (!authUser) {
        console.log("[Auth] Login failed - no user returned");
        return { success: false, error: "Login failed. Please try again." };
      }

      console.log("[Auth] Login successful, user ID:", authUser.id);
      setUser(authUser);

      // Fetch the user's profile to get their role
      console.log("[Auth] Fetching user profile...");
      const userProfile = await getCurrentProfile();

      if (!userProfile) {
        console.log("[Auth] Profile not found for user");
        return { success: false, error: "User profile not found. Please contact support." };
      }

      console.log("[Auth] Profile found, role:", userProfile.role);
      setProfile(userProfile);
      return { success: true, role: userProfile.role };
    } catch (error) {
      console.error("[Auth] Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid credentials";
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await supabaseSignOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if signOut fails
      setUser(null);
      setProfile(null);
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // Get initial session - use getUser() to validate with server
    const initializeAuth = async () => {
      try {
        // Add 10-second timeout to prevent indefinite hangs
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        );

        const authPromise = supabase.auth.getUser();
        const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);

        // If there's an error or no user, just mark as not loading
        if (error || !user) {
          setIsLoading(false);
          return;
        }

        setUser(user);
        // Use getProfileById instead of getCurrentProfile to avoid double getUser() call
        const userProfile = await getProfileById(user.id);
        setProfile(userProfile);
      } catch (error) {
        // Silent fail for initialization - user just isn't logged in
        console.warn("Auth initialization:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (non-async to avoid Supabase deadlock)
    // See: https://github.com/supabase/supabase/issues/35754
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user);
      }
      // Note: SIGNED_IN is handled by login() function, not here
      // This prevents the async deadlock issue
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
