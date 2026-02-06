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

// ==========================================
// User Management Functions (Admin)
// ==========================================

/**
 * Update a user's profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, "id" | "email" | "created_at">>
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a user's profile (deprecated - use deleteUser instead)
 * Note: This only deletes from the profiles table.
 * Full auth user deletion requires admin API or service role key.
 * @deprecated Use deleteUser() instead for complete user removal
 */
export async function deleteUserProfile(userId: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);

  if (error) {
    throw error;
  }
}

/**
 * Delete a user completely (auth + profile)
 * Calls the server-side API route which uses the service role key
 * to delete from auth.users (profile is deleted via cascade)
 */
export async function deleteUser(userId: string): Promise<void> {
  // Get the current session to pass the auth token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to delete user");
  }
}

/**
 * Create user data for admin-created users
 */
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: UserRole;
  department?: string;
  studentId?: string;
  course?: string;
  yearLevel?: string;
}

/**
 * Create a new user (admin function)
 * Calls the server-side API route which uses the service role key
 * to create user via admin API (preserves admin's session)
 */
export async function createUser(data: CreateUserData) {
  // Get the current session to pass the auth token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Failed to create user");
  }

  return response.json();
}

/**
 * Get all users/profiles (admin function)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// ==========================================
// Department Management Types and Functions
// ==========================================

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface DepartmentWithHead extends Department {
  head?: Profile | null;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

/**
 * Get all departments with optional head profile
 */
export async function getAllDepartments(): Promise<DepartmentWithHead[]> {
  const { data, error } = await supabase
    .from("departments")
    .select(`
      *,
      head:profiles!departments_head_id_fkey(*)
    `)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get a department by ID with head profile
 */
export async function getDepartmentById(
  id: string
): Promise<DepartmentWithHead | null> {
  const { data, error } = await supabase
    .from("departments")
    .select(`
      *,
      head:profiles!departments_head_id_fkey(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Create a new department
 */
export async function createDepartment(
  data: CreateDepartmentData
): Promise<Department> {
  const { data: department, error } = await supabase
    .from("departments")
    .insert({
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || null,
      head_id: data.head_id || null,
      logo_url: data.logo_url || null,
      status: data.status || "active",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return department;
}

/**
 * Update a department
 */
export async function updateDepartment(
  id: string,
  data: UpdateDepartmentData
): Promise<Department> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.description !== undefined) updates.description = data.description;
  if (data.head_id !== undefined) updates.head_id = data.head_id;
  if (data.logo_url !== undefined) updates.logo_url = data.logo_url;
  if (data.status !== undefined) updates.status = data.status;

  const { data: department, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return department;
}

/**
 * Delete a department
 */
export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from("departments").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Get users with role "department" who are not linked to any department
 */
export async function getUnlinkedDepartmentUsers(): Promise<Profile[]> {
  // First get all head_ids from departments
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("head_id")
    .not("head_id", "is", null);

  if (deptError) {
    throw deptError;
  }

  const linkedHeadIds = departments?.map((d) => d.head_id).filter(Boolean) || [];

  // Get all users with role "department" who are not in the linked list
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "department")
    .order("last_name", { ascending: true });

  if (linkedHeadIds.length > 0) {
    query = query.not("id", "in", `(${linkedHeadIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get all users with role "department" (for dropdown including current head)
 */
export async function getDepartmentRoleUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "department")
    .order("last_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

// ==========================================
// Office Management Types and Functions
// ==========================================

export interface Office {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface OfficeWithHead extends Office {
  head?: Profile | null;
}

export interface CreateOfficeData {
  name: string;
  code: string;
  description?: string;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateOfficeData {
  name?: string;
  code?: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

/**
 * Get all offices with optional head profile
 */
export async function getAllOffices(): Promise<OfficeWithHead[]> {
  const { data, error } = await supabase
    .from("offices")
    .select(`
      *,
      head:profiles!offices_head_id_fkey(*)
    `)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get an office by ID with head profile
 */
export async function getOfficeById(
  id: string
): Promise<OfficeWithHead | null> {
  const { data, error } = await supabase
    .from("offices")
    .select(`
      *,
      head:profiles!offices_head_id_fkey(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Create a new office
 */
export async function createOffice(
  data: CreateOfficeData
): Promise<Office> {
  const { data: office, error } = await supabase
    .from("offices")
    .insert({
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || null,
      head_id: data.head_id || null,
      logo_url: data.logo_url || null,
      status: data.status || "active",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return office;
}

/**
 * Update an office
 */
export async function updateOffice(
  id: string,
  data: UpdateOfficeData
): Promise<Office> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.description !== undefined) updates.description = data.description;
  if (data.head_id !== undefined) updates.head_id = data.head_id;
  if (data.logo_url !== undefined) updates.logo_url = data.logo_url;
  if (data.status !== undefined) updates.status = data.status;

  const { data: office, error } = await supabase
    .from("offices")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return office;
}

/**
 * Delete an office
 */
export async function deleteOffice(id: string): Promise<void> {
  const { error } = await supabase.from("offices").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Get users with role "office" who are not linked to any office
 */
export async function getUnlinkedOfficeUsers(): Promise<Profile[]> {
  // First get all head_ids from offices
  const { data: offices, error: officeError } = await supabase
    .from("offices")
    .select("head_id")
    .not("head_id", "is", null);

  if (officeError) {
    throw officeError;
  }

  const linkedHeadIds = offices?.map((o) => o.head_id).filter(Boolean) || [];

  // Get all users with role "office" who are not in the linked list
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "office")
    .order("last_name", { ascending: true });

  if (linkedHeadIds.length > 0) {
    query = query.not("id", "in", `(${linkedHeadIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get all users with role "office" (for dropdown including current head)
 */
export async function getOfficeRoleUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "office")
    .order("last_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

// ==========================================
// Club Management Types and Functions
// ==========================================

export type ClubType = "academic" | "non-academic";

export interface Club {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  type: ClubType;
  adviser_id?: string | null;
  department?: string | null;
  logo_url?: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface ClubWithAdviser extends Club {
  adviser?: Profile | null;
}

export interface CreateClubData {
  name: string;
  code: string;
  description?: string;
  type: ClubType;
  adviser_id?: string | null;
  department?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateClubData {
  name?: string;
  code?: string;
  description?: string | null;
  type?: ClubType;
  adviser_id?: string | null;
  department?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

/**
 * Get all clubs with optional adviser profile
 */
export async function getAllClubs(): Promise<ClubWithAdviser[]> {
  const { data, error } = await supabase
    .from("clubs")
    .select(`
      *,
      adviser:profiles!clubs_adviser_id_fkey(*)
    `)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get a club by ID with adviser profile
 */
export async function getClubById(
  id: string
): Promise<ClubWithAdviser | null> {
  const { data, error } = await supabase
    .from("clubs")
    .select(`
      *,
      adviser:profiles!clubs_adviser_id_fkey(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Create a new club
 */
export async function createClub(
  data: CreateClubData
): Promise<Club> {
  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || null,
      type: data.type,
      adviser_id: data.adviser_id || null,
      department: data.department || null,
      logo_url: data.logo_url || null,
      status: data.status || "active",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return club;
}

/**
 * Update a club
 */
export async function updateClub(
  id: string,
  data: UpdateClubData
): Promise<Club> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.description !== undefined) updates.description = data.description;
  if (data.type !== undefined) updates.type = data.type;
  if (data.adviser_id !== undefined) updates.adviser_id = data.adviser_id;
  if (data.department !== undefined) updates.department = data.department;
  if (data.logo_url !== undefined) updates.logo_url = data.logo_url;
  if (data.status !== undefined) updates.status = data.status;

  const { data: club, error } = await supabase
    .from("clubs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return club;
}

/**
 * Delete a club
 */
export async function deleteClub(id: string): Promise<void> {
  const { error } = await supabase.from("clubs").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Get users with role "club" who are not linked to any club
 */
export async function getUnlinkedClubUsers(): Promise<Profile[]> {
  // First get all adviser_ids from clubs
  const { data: clubs, error: clubError } = await supabase
    .from("clubs")
    .select("adviser_id")
    .not("adviser_id", "is", null);

  if (clubError) {
    throw clubError;
  }

  const linkedAdviserIds = clubs?.map((c) => c.adviser_id).filter(Boolean) || [];

  // Get all users with role "club" who are not in the linked list
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "club")
    .order("last_name", { ascending: true });

  if (linkedAdviserIds.length > 0) {
    query = query.not("id", "in", `(${linkedAdviserIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get all users with role "club" (for dropdown including current adviser)
 */
export async function getClubRoleUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "club")
    .order("last_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}
