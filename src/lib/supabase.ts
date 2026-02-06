import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://joyrstittieqqfvvuuwb.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpveXJzdGl0dGllcXFmdnZ1dXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzExMDAsImV4cCI6MjA4NTk0NzEwMH0.4KX0OIQhYqYjDO2F2vl7OQ5jrxxqcs158X8kJYqg57I";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type UserRole = "student" | "office" | "department" | "club" | "admin";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  role: UserRole;
  student_id?: string | null;
  course?: string | null;
  year_level?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Registration data types
export interface AdminRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
}

export interface StudentRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  studentId: string;
  course: string;
  yearLevel: string;
  department: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Auth helper functions

/**
 * Register a new admin user
 */
export async function registerAdmin(data: AdminRegistrationData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName || null,
        role: "admin",
      },
      // Skip email confirmation for instant login
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    throw error;
  }

  return authData;
}

/**
 * Register a new student user
 */
export async function registerStudent(data: StudentRegistrationData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName || null,
        role: "student",
        student_id: data.studentId,
        course: data.course,
        year_level: data.yearLevel,
        department: data.department,
      },
    },
  });

  if (error) {
    throw error;
  }

  return authData;
}

/**
 * Sign in with email and password
 */
export async function signIn(data: SignInData) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    throw error;
  }

  return authData;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // No user logged in - this is normal, not an error
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // PGRST116 means no rows returned - profile doesn't exist yet
    if (error.code === "PGRST116") {
      console.warn("Profile not found for user:", user.id);
    } else {
      console.error("Error fetching profile:", error.message || error);
    }
    return null;
  }

  return profile;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  return user;
}

/**
 * Get a user's profile by ID (without calling getUser())
 * Use this inside onAuthStateChange to avoid deadlocks
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      console.warn("Profile not found for user:", userId);
    } else {
      console.error("Error fetching profile:", error.message || error);
    }
    return null;
  }

  return profile;
}
