import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://joyrstittieqqfvvuuwb.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpveXJzdGl0dGllcXFmdnZ1dXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzExMDAsImV4cCI6MjA4NTk0NzEwMH0.4KX0OIQhYqYjDO2F2vl7OQ5jrxxqcs158X8kJYqg57I";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type UserRole = "student" | "office" | "department" | "club" | "csg_department_lgu" | "cspsg_division" | "csg" | "cspsg" | "admin";

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
  enrolled_clubs?: string | null;
  date_of_birth?: string | null;
  cspsg_division?: string | null;
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
  dateOfBirth?: string;
  studentId: string;
  course: string;
  yearLevel: string;
  department: string;
  enrolledClubs?: string;
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
        enrolled_clubs: data.enrolledClubs || null,
        date_of_birth: data.dateOfBirth || null,
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
  enrolledClubs?: string;
  dateOfBirth?: string;
  cspsgDivision?: string;
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

/** Get a department by its code (e.g. "CCIS") */
export async function getDepartmentByCode(
  code: string
): Promise<Department | null> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .ilike("code", code)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
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
// LGU Management Types and Functions
// ==========================================

export interface CsgDepartmentLgu {
  id: string;
  name: string;
  code: string;
  department_code: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CsgDepartmentLguWithHead extends CsgDepartmentLgu {
  head?: Profile | null;
}

export interface CreateCsgDepartmentLguData {
  name: string;
  code: string;
  department_code: string;
  description?: string;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateCsgDepartmentLguData {
  name?: string;
  code?: string;
  department_code?: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export async function getAllCsgDepartmentLgus(): Promise<CsgDepartmentLguWithHead[]> {
  const { data, error } = await supabase
    .from("csg_department_lgus")
    .select(`
      *,
      head:profiles!csg_department_lgus_head_id_fkey(*)
    `)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCsgDepartmentLguById(id: string): Promise<CsgDepartmentLguWithHead | null> {
  const { data, error } = await supabase
    .from("csg_department_lgus")
    .select(`
      *,
      head:profiles!csg_department_lgus_head_id_fkey(*)
    `)
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getCsgDepartmentLguByHeadId(userId: string): Promise<CsgDepartmentLgu | null> {
  const { data, error } = await supabase
    .from("csg_department_lgus")
    .select("*")
    .eq("head_id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function getCsgDepartmentLguByDepartmentCode(departmentCode: string): Promise<CsgDepartmentLgu | null> {
  const { data, error } = await supabase
    .from("csg_department_lgus")
    .select("*")
    .eq("department_code", departmentCode)
    .eq("status", "active")
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getCsgDepartmentLguWithHeadByDepartmentCode(departmentCode: string): Promise<CsgDepartmentLguWithHead | null> {
  const { data, error } = await supabase
    .from("csg_department_lgus")
    .select(`
      *,
      head:profiles!csg_department_lgus_head_id_fkey(*)
    `)
    .eq("department_code", departmentCode)
    .eq("status", "active")
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function createCsgDepartmentLgu(data: CreateCsgDepartmentLguData): Promise<CsgDepartmentLgu> {
  const { data: lgu, error } = await supabase
    .from("csg_department_lgus")
    .insert({
      name: data.name,
      code: data.code.toUpperCase(),
      department_code: data.department_code.toUpperCase(),
      description: data.description || null,
      head_id: data.head_id || null,
      logo_url: data.logo_url || null,
      status: data.status || "active",
    })
    .select()
    .single();
  if (error) throw error;
  return lgu;
}

export async function updateCsgDepartmentLgu(id: string, data: UpdateCsgDepartmentLguData): Promise<CsgDepartmentLgu> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.department_code !== undefined) updates.department_code = data.department_code.toUpperCase();
  if (data.description !== undefined) updates.description = data.description;
  if (data.head_id !== undefined) updates.head_id = data.head_id;
  if (data.logo_url !== undefined) updates.logo_url = data.logo_url;
  if (data.status !== undefined) updates.status = data.status;

  const { data: lgu, error } = await supabase
    .from("csg_department_lgus")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return lgu;
}

export async function deleteCsgDepartmentLgu(id: string): Promise<void> {
  const { error } = await supabase.from("csg_department_lgus").delete().eq("id", id);
  if (error) throw error;
}

export async function getUnlinkedCsgDepartmentLguUsers(): Promise<Profile[]> {
  const { data: lgus, error: lguError } = await supabase
    .from("csg_department_lgus")
    .select("head_id")
    .not("head_id", "is", null);
  if (lguError) throw lguError;

  const linkedHeadIds = lgus?.map((d) => d.head_id).filter(Boolean) || [];

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "csg_department_lgu")
    .order("last_name", { ascending: true });

  if (linkedHeadIds.length > 0) {
    query = query.not("id", "in", `(${linkedHeadIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCsgDepartmentLguRoleUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "csg_department_lgu")
    .order("last_name", { ascending: true });
  if (error) throw error;
  return data || [];
}

// ==========================================
// CSPSG Division Management Types and Functions
// ==========================================

export interface CspsgDivision {
  id: string;
  name: string;
  code: string;
  department_code: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CspsgDivisionWithHead extends CspsgDivision {
  head?: Profile | null;
}

export interface CreateCspsgDivisionData {
  name: string;
  code: string;
  department_code: string;
  description?: string;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateCspsgDivisionData {
  name?: string;
  code?: string;
  department_code?: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export async function getAllCspsgDivisions(): Promise<CspsgDivisionWithHead[]> {
  const { data, error } = await supabase
    .from("cspsg_divisions")
    .select(`
      *,
      head:profiles!cspsg_divisions_head_id_fkey(*)
    `)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCspsgDivisionById(id: string): Promise<CspsgDivisionWithHead | null> {
  const { data, error } = await supabase
    .from("cspsg_divisions")
    .select(`
      *,
      head:profiles!cspsg_divisions_head_id_fkey(*)
    `)
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getCspsgDivisionByHeadId(userId: string): Promise<CspsgDivision | null> {
  const { data, error } = await supabase
    .from("cspsg_divisions")
    .select("*")
    .eq("head_id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function getCspsgDivisionByCode(code: string): Promise<CspsgDivision | null> {
  const { data, error } = await supabase
    .from("cspsg_divisions")
    .select("*")
    .ilike("code", code)
    .eq("status", "active")
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getCspsgDivisionWithHeadByCode(code: string): Promise<CspsgDivisionWithHead | null> {
  const { data, error } = await supabase
    .from("cspsg_divisions")
    .select(`
      *,
      head:profiles!cspsg_divisions_head_id_fkey(*)
    `)
    .ilike("code", code)
    .eq("status", "active")
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function createCspsgDivision(data: CreateCspsgDivisionData): Promise<CspsgDivision> {
  const { data: division, error } = await supabase
    .from("cspsg_divisions")
    .insert({
      name: data.name,
      code: data.code.toUpperCase(),
      department_code: data.department_code.toUpperCase(),
      description: data.description || null,
      head_id: data.head_id || null,
      logo_url: data.logo_url || null,
      status: data.status || "active",
    })
    .select()
    .single();
  if (error) throw error;
  return division;
}

export async function updateCspsgDivision(id: string, data: UpdateCspsgDivisionData): Promise<CspsgDivision> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.department_code !== undefined) updates.department_code = data.department_code.toUpperCase();
  if (data.description !== undefined) updates.description = data.description;
  if (data.head_id !== undefined) updates.head_id = data.head_id;
  if (data.logo_url !== undefined) updates.logo_url = data.logo_url;
  if (data.status !== undefined) updates.status = data.status;

  const { data: division, error } = await supabase
    .from("cspsg_divisions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return division;
}

export async function deleteCspsgDivision(id: string): Promise<void> {
  const { error } = await supabase.from("cspsg_divisions").delete().eq("id", id);
  if (error) throw error;
}

export async function getUnlinkedCspsgDivisionUsers(): Promise<Profile[]> {
  const { data: divisions, error: divError } = await supabase
    .from("cspsg_divisions")
    .select("head_id")
    .not("head_id", "is", null);
  if (divError) throw divError;

  const linkedHeadIds = divisions?.map((d) => d.head_id).filter(Boolean) || [];

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "cspsg_division")
    .order("last_name", { ascending: true });

  if (linkedHeadIds.length > 0) {
    query = query.not("id", "in", `(${linkedHeadIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCspsgDivisionRoleUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "cspsg_division")
    .order("last_name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getStudentsByDivision(divisionCode: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .eq("cspsg_division", divisionCode)
    .order("last_name", { ascending: true });
  if (error) throw error;
  return data || [];
}

// ==========================================
// CSG (School-wide) Management Types and Functions
// ==========================================

export interface Csg {
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

export interface CsgWithHead extends Csg {
  head?: Profile | null;
}

export interface CreateCsgData {
  name: string;
  code: string;
  description?: string;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateCsgData {
  name?: string;
  code?: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export async function getAllCsg(): Promise<CsgWithHead[]> {
  const { data, error } = await supabase
    .from("csg")
    .select(`*, head:profiles!csg_head_id_fkey(*)`)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCsgById(id: string): Promise<CsgWithHead | null> {
  const { data, error } = await supabase
    .from("csg")
    .select(`*, head:profiles!csg_head_id_fkey(*)`)
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getCsgByHeadId(userId: string): Promise<Csg | null> {
  const { data, error } = await supabase
    .from("csg")
    .select("*")
    .eq("head_id", userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getActiveCsg(): Promise<Csg | null> {
  const { data, error } = await supabase
    .from("csg")
    .select("*")
    .eq("status", "active")
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function createCsg(data: CreateCsgData): Promise<Csg> {
  const { data: org, error } = await supabase
    .from("csg")
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
  if (error) throw error;
  return org;
}

export async function updateCsg(id: string, data: UpdateCsgData): Promise<Csg> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.description !== undefined) updates.description = data.description;
  if (data.head_id !== undefined) updates.head_id = data.head_id;
  if (data.logo_url !== undefined) updates.logo_url = data.logo_url;
  if (data.status !== undefined) updates.status = data.status;

  const { data: org, error } = await supabase
    .from("csg")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return org;
}

export async function deleteCsg(id: string): Promise<void> {
  const { error } = await supabase.from("csg").delete().eq("id", id);
  if (error) throw error;
}

export async function getUnlinkedCsgUsers(): Promise<Profile[]> {
  const { data: orgs, error: orgError } = await supabase
    .from("csg")
    .select("head_id")
    .not("head_id", "is", null);
  if (orgError) throw orgError;

  const linkedHeadIds = orgs?.map((d) => d.head_id).filter(Boolean) || [];

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "csg")
    .order("last_name", { ascending: true });

  if (linkedHeadIds.length > 0) {
    query = query.not("id", "in", `(${linkedHeadIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCsgRoleUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "csg")
    .order("last_name", { ascending: true });
  if (error) throw error;
  return data || [];
}

// ==========================================
// CSP (School-wide) Management Types and Functions
// ==========================================

export interface Cspsg {
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

export interface CspsgWithHead extends Cspsg {
  head?: Profile | null;
}

export interface CreateCspData {
  name: string;
  code: string;
  description?: string;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateCspData {
  name?: string;
  code?: string;
  description?: string | null;
  head_id?: string | null;
  logo_url?: string | null;
  status?: "active" | "inactive";
}

export async function getAllCspsg(): Promise<CspsgWithHead[]> {
  const { data, error } = await supabase
    .from("cspsg")
    .select(`*, head:profiles!csp_head_id_fkey(*)`)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCspsgById(id: string): Promise<CspsgWithHead | null> {
  const { data, error } = await supabase
    .from("cspsg")
    .select(`*, head:profiles!csp_head_id_fkey(*)`)
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getCspsgByHeadId(userId: string): Promise<Cspsg | null> {
  const { data, error } = await supabase
    .from("cspsg")
    .select("*")
    .eq("head_id", userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getActiveCspsg(): Promise<Cspsg | null> {
  const { data, error } = await supabase
    .from("cspsg")
    .select("*")
    .eq("status", "active")
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function createCspsg(data: CreateCspData): Promise<Cspsg> {
  const { data: org, error } = await supabase
    .from("cspsg")
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
  if (error) throw error;
  return org;
}

export async function updateCspsg(id: string, data: UpdateCspData): Promise<Cspsg> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.description !== undefined) updates.description = data.description;
  if (data.head_id !== undefined) updates.head_id = data.head_id;
  if (data.logo_url !== undefined) updates.logo_url = data.logo_url;
  if (data.status !== undefined) updates.status = data.status;

  const { data: org, error } = await supabase
    .from("cspsg")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return org;
}

export async function deleteCspsg(id: string): Promise<void> {
  const { error } = await supabase.from("cspsg").delete().eq("id", id);
  if (error) throw error;
}

export async function getUnlinkedCspsgUsers(): Promise<Profile[]> {
  const { data: orgs, error: orgError } = await supabase
    .from("cspsg")
    .select("head_id")
    .not("head_id", "is", null);
  if (orgError) throw orgError;

  const linkedHeadIds = orgs?.map((d) => d.head_id).filter(Boolean) || [];

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "cspsg")
    .order("last_name", { ascending: true });

  if (linkedHeadIds.length > 0) {
    query = query.not("id", "in", `(${linkedHeadIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCspsgRoleUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "cspsg")
    .order("last_name", { ascending: true });
  if (error) throw error;
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

/** Get all student profiles (for office-level views — no department/club filter) */
export async function getAllStudentProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("last_name", { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Get the office where the given user is head */
export async function getOfficeByHeadId(userId: string): Promise<Office | null> {
  const { data, error } = await supabase
    .from("offices")
    .select("*")
    .eq("head_id", userId)
    .single();
  if (error) return null;
  return data;
}

/** Get the department where the given user is head */
export async function getDepartmentByHeadId(userId: string): Promise<Department | null> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("head_id", userId)
    .single();
  if (error) return null;
  return data;
}

/** Get the club where the given user is adviser */
export async function getClubByAdviserId(userId: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("adviser_id", userId)
    .single();
  if (error) return null;
  return data;
}

/** Get all students enrolled in a specific club by checking enrolled_clubs field */
export async function getMembersByClub(clubId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('last_name', { ascending: true });

  if (error) throw error;

  // Filter client-side for exact match in comma-separated enrolled_clubs (stores club IDs)
  const filtered = (data || []).filter(p =>
    p.enrolled_clubs?.split(',').map((c: string) => c.trim()).includes(clubId)
  );

  return filtered;
}

// ==========================================
// Course Management Types and Functions
// ==========================================

export interface Course {
  id: string;
  department_id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CreateCourseData {
  department_id: string;
  name: string;
  code: string;
  status?: "active" | "inactive";
}

export interface UpdateCourseData {
  name?: string;
  code?: string;
  status?: "active" | "inactive";
}

/** Get all active courses for a given department */
export async function getCoursesByDepartmentId(departmentId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("department_id", departmentId)
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

/** Get all courses for a department (admin/head view, includes inactive) */
export async function getAllCoursesByDepartmentId(departmentId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("department_id", departmentId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCourse(data: CreateCourseData): Promise<Course> {
  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      department_id: data.department_id,
      name: data.name,
      code: data.code.toUpperCase(),
      status: data.status || "active",
    })
    .select()
    .single();
  if (error) throw error;
  return course;
}

export async function updateCourse(id: string, data: UpdateCourseData): Promise<Course> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.status !== undefined) updates.status = data.status;
  const { data: course, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return course;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

// ==========================================
// Announcement Management Types and Functions
// ==========================================

export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";
export type AnnouncementScope = "system" | "department" | "office" | "club";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  posted_by_id: string;
  department_id?: string | null;
  office_id?: string | null;
  club_id?: string | null;
  csg_department_lgu_id?: string | null;
  cspsg_division_id?: string | null;
  csg_id?: string | null;
  cspsg_id?: string | null;
  is_system_wide: boolean;
  priority: AnnouncementPriority;
  event_date?: string | null;
  event_location?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithRelations extends Announcement {
  posted_by?: Profile | null;
  department?: Department | null;
  office?: Office | null;
  club?: Club | null;
  csg_department_lgu?: CsgDepartmentLgu | null;
  cspsg_division?: CspsgDivision | null;
  csg?: Csg | null;
  cspsg?: Cspsg | null;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  posted_by_id: string;
  department_id?: string | null;
  office_id?: string | null;
  club_id?: string | null;
  csg_department_lgu_id?: string | null;
  cspsg_division_id?: string | null;
  csg_id?: string | null;
  cspsg_id?: string | null;
  is_system_wide?: boolean;
  priority?: AnnouncementPriority;
  event_date?: string | null;
  event_location?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  department_id?: string | null;
  office_id?: string | null;
  club_id?: string | null;
  csg_department_lgu_id?: string | null;
  cspsg_division_id?: string | null;
  csg_id?: string | null;
  cspsg_id?: string | null;
  is_system_wide?: boolean;
  priority?: AnnouncementPriority;
  event_date?: string | null;
  event_location?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
}

/**
 * Get all announcements with relations (for admin view)
 */
export async function getAllAnnouncements(): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      department:departments!announcements_department_id_fkey(*),
      office:offices!announcements_office_id_fkey(*),
      club:clubs!announcements_club_id_fkey(*),
      csg_department_lgu:csg_department_lgus!announcements_csg_department_lgu_id_fkey(*),
      cspsg_division:cspsg_divisions!announcements_cspsg_division_id_fkey(*),
      csg:csg!announcements_csg_id_fkey(*),
      cspsg:cspsg!announcements_cspsg_id_fkey(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get active, non-expired announcements (for student view)
 */
export async function getActiveAnnouncements(): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      department:departments!announcements_department_id_fkey(*),
      office:offices!announcements_office_id_fkey(*),
      club:clubs!announcements_club_id_fkey(*),
      csg_department_lgu:csg_department_lgus!announcements_csg_department_lgu_id_fkey(*),
      cspsg_division:cspsg_divisions!announcements_cspsg_division_id_fkey(*),
      csg:csg!announcements_csg_id_fkey(*),
      cspsg:cspsg!announcements_cspsg_id_fkey(*)
    `)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get an announcement by ID with relations
 */
export async function getAnnouncementById(
  id: string
): Promise<AnnouncementWithRelations | null> {
  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      department:departments!announcements_department_id_fkey(*),
      office:offices!announcements_office_id_fkey(*),
      club:clubs!announcements_club_id_fkey(*)
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
 * Create a new announcement
 */
export async function createAnnouncement(
  data: CreateAnnouncementData
): Promise<Announcement> {
  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      title: data.title,
      content: data.content,
      posted_by_id: data.posted_by_id,
      department_id: data.department_id || null,
      office_id: data.office_id || null,
      club_id: data.club_id || null,
      csg_department_lgu_id: data.csg_department_lgu_id || null,
      cspsg_division_id: data.cspsg_division_id || null,
      csg_id: data.csg_id || null,
      cspsg_id: data.cspsg_id || null,
      is_system_wide: data.is_system_wide || false,
      priority: data.priority || "normal",
      event_date: data.event_date || null,
      event_location: data.event_location || null,
      expires_at: data.expires_at || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return announcement;
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementData
): Promise<Announcement> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.content !== undefined) updates.content = data.content;
  if (data.department_id !== undefined) updates.department_id = data.department_id;
  if (data.office_id !== undefined) updates.office_id = data.office_id;
  if (data.club_id !== undefined) updates.club_id = data.club_id;
  if (data.csg_department_lgu_id !== undefined) updates.csg_department_lgu_id = data.csg_department_lgu_id;
  if (data.cspsg_division_id !== undefined) updates.cspsg_division_id = data.cspsg_division_id;
  if (data.csg_id !== undefined) updates.csg_id = data.csg_id;
  if (data.cspsg_id !== undefined) updates.cspsg_id = data.cspsg_id;
  if (data.is_system_wide !== undefined) updates.is_system_wide = data.is_system_wide;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.event_date !== undefined) updates.event_date = data.event_date;
  if (data.event_location !== undefined) updates.event_location = data.event_location;
  if (data.expires_at !== undefined) updates.expires_at = data.expires_at;
  if (data.is_active !== undefined) updates.is_active = data.is_active;

  const { data: announcement, error } = await supabase
    .from("announcements")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return announcement;
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Announcement not found or you do not have permission to delete it.");
  }
}

/** Fetch all announcements posted by a given department (scoped by department_id), including inactive ones owned by the caller */
export async function getAnnouncementsByDepartment(
  deptId: string
): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      department:departments!announcements_department_id_fkey(*)
    `)
    .eq('department_id', deptId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AnnouncementWithRelations[]) || [];
}

/** Fetch all announcements scoped to a given office (by office_id) */
export async function getAnnouncementsByOffice(
  officeId: string
): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      office:offices!announcements_office_id_fkey(*)
    `)
    .eq('office_id', officeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AnnouncementWithRelations[]) || [];
}

/** Fetch all announcements scoped to a given club (by club_id) */
export async function getAnnouncementsByClub(
  clubId: string
): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      club:clubs!announcements_club_id_fkey(*)
    `)
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AnnouncementWithRelations[]) || [];
}

/** Fetch all announcements scoped to a given LGU (by csg_department_lgu_id) */
export async function getAnnouncementsByCsgDepartmentLgu(
  csgLguId: string
): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      csg_department_lgu:csg_department_lgus!announcements_csg_department_lgu_id_fkey(*)
    `)
    .eq('csg_department_lgu_id', csgLguId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AnnouncementWithRelations[]) || [];
}

export async function getAnnouncementsByCsg(csgId: string): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      csg:csg!announcements_csg_id_fkey(*)
    `)
    .eq('csg_id', csgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AnnouncementWithRelations[]) || [];
}

export async function getAnnouncementsByCspsg(cspsgId: string): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*),
      cspsg:cspsg!announcements_cspsg_id_fkey(*)
    `)
    .eq('cspsg_id', cspsgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AnnouncementWithRelations[]) || [];
}

// ==========================================
// System Settings (Singleton)
// ==========================================

export interface SystemSettings {
  id: string;
  academic_year: string;
  current_semester: string;
  semester_start_date?: string | null;
  semester_deadline?: string | null;
  allow_semester_clearance: boolean;
  updated_by?: string | null;
  updated_at: string;
  created_at: string;
}

export type UpdateSystemSettingsData = Omit<SystemSettings,
  'id' | 'created_at' | 'updated_at' | 'updated_by'
>;

/** Fetch the singleton system settings row */
export async function getSystemSettings(): Promise<SystemSettings | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/** Update system settings (admin only, updates the singleton row) */
export async function updateSystemSettings(
  id: string,
  data: Partial<UpdateSystemSettingsData>,
  updatedBy: string
): Promise<SystemSettings> {
  const { data: settings, error } = await supabase
    .from('system_settings')
    .update({ ...data, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return settings;
}

/** Count active (pending/in_progress) clearance requests for a specific period */
export async function countActiveRequestsForPeriod(
  academicYear: string,
  semester: string
): Promise<number> {
  const { count, error } = await supabase
    .from("clearance_requests")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "in_progress"])
    .eq("academic_year", academicYear)
    .eq("semester", semester);
  if (error) throw error;
  return count ?? 0;
}

// ==========================================
// Clearance Requests
// ==========================================

export interface ClearanceRequest {
  id: string;
  student_id: string;
  type: 'semester';
  academic_year: string;
  semester: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

/**
 * Get all student profiles whose department column matches the given department code
 * (students store the dept code, e.g. "CCIS", not the full name)
 */
export async function getStudentsByDepartment(departmentCode: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .eq('department', departmentCode)
    .order('last_name', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get clearance requests for a list of student IDs, ordered by created_at DESC.
 * Caller picks the latest per student_id.
 */
export async function getClearanceRequestsByStudentIds(studentIds: string[]): Promise<ClearanceRequest[]> {
  if (studentIds.length === 0) return [];

  const { data, error } = await supabase
    .from('clearance_requests')
    .select('*')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// ==========================================
// Distinct Periods
// ==========================================

export interface DistinctPeriod {
  academic_year: string;
  semester: string;
}

export async function getDistinctPeriods(
  currentPeriod?: { academic_year: string; semester: string }
): Promise<DistinctPeriod[]> {
  const { data, error } = await supabase
    .from('clearance_requests')
    .select('academic_year, semester')
    .order('academic_year', { ascending: false });
  if (error) throw error;

  // De-duplicate in JS (Supabase JS client has no DISTINCT)
  const seen = new Set<string>();
  const unique: DistinctPeriod[] = [];
  for (const row of data ?? []) {
    const key = `${row.academic_year}|${row.semester}`;
    if (!seen.has(key)) { seen.add(key); unique.push({ academic_year: row.academic_year, semester: row.semester }); }
  }

  // Ensure the current system period is always present
  if (currentPeriod) {
    const currentKey = `${currentPeriod.academic_year}|${currentPeriod.semester}`;
    if (!seen.has(currentKey)) {
      unique.push({ academic_year: currentPeriod.academic_year, semester: currentPeriod.semester });
    }
  }

  // Sort: year DESC, then Summer > 2nd Semester > 1st Semester
  const semOrder: Record<string, number> = { 'Summer': 0, '2nd Semester': 1, '1st Semester': 2 };
  unique.sort((a, b) => {
    if (b.academic_year > a.academic_year) return 1;
    if (b.academic_year < a.academic_year) return -1;
    return (semOrder[a.semester] ?? 99) - (semOrder[b.semester] ?? 99);
  });
  return unique;
}

// ==========================================
// Requirements
// ==========================================

export interface RequirementLink {
  id: string;
  requirement_id: string;
  url: string;
  label?: string | null;
  order: number;
  created_at: string;
}

export interface Requirement {
  id: string;
  source_type: string;
  source_id: string;
  name: string;
  description?: string | null;
  is_required: boolean;
  requires_upload: boolean;
  is_published: boolean;
  is_attendance: boolean;
  first_published_at: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  links?: RequirementLink[];
}

/** Get all requirements for a given source (department/office/club), with embedded links */
export async function getRequirementsBySource(
  sourceType: string,
  sourceId: string
): Promise<Requirement[]> {
  const { data, error } = await supabase
    .from('requirements')
    .select('*, links:requirement_links(id, url, label, order, created_at)')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((r) => ({
    ...r,
    links: ((r.links as RequirementLink[]) || []).sort((a, b) => a.order - b.order),
  }));
}

// ==========================================
// Requirement Links CRUD
// ==========================================

/** Get all links for a requirement */
export async function getRequirementLinks(requirementId: string): Promise<RequirementLink[]> {
  const { data, error } = await supabase
    .from('requirement_links')
    .select('*')
    .eq('requirement_id', requirementId)
    .order('order', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Add a link to a requirement */
export async function addRequirementLink(
  requirementId: string,
  url: string,
  label?: string,
  order?: number
): Promise<RequirementLink> {
  const { data, error } = await supabase
    .from('requirement_links')
    .insert({ requirement_id: requirementId, url, label: label || null, order: order ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Update an existing requirement link */
export async function updateRequirementLink(
  id: string,
  url: string,
  label?: string,
  order?: number
): Promise<RequirementLink> {
  const updates: Record<string, unknown> = { url };
  if (label !== undefined) updates.label = label || null;
  if (order !== undefined) updates.order = order;
  const { data, error } = await supabase
    .from('requirement_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Delete a requirement link */
export async function deleteRequirementLink(id: string): Promise<void> {
  const { error } = await supabase.from('requirement_links').delete().eq('id', id);
  if (error) throw error;
}

/** Replace all links for a requirement (delete all then re-insert) */
export async function replaceRequirementLinks(
  requirementId: string,
  links: Array<{ url: string; label?: string; order: number }>
): Promise<void> {
  const { error: delErr } = await supabase
    .from('requirement_links')
    .delete()
    .eq('requirement_id', requirementId);
  if (delErr) throw delErr;

  if (links.length === 0) return;

  const rows = links.map((l) => ({
    requirement_id: requirementId,
    url: l.url,
    label: l.label || null,
    order: l.order,
  }));
  const { error: insErr } = await supabase.from('requirement_links').insert(rows);
  if (insErr) throw insErr;
}

/** Create a new requirement */
export async function createRequirement(data: {
  source_type: string;
  source_id: string;
  name: string;
  description?: string;
  is_required?: boolean;
  requires_upload?: boolean;
  is_attendance?: boolean;
  order?: number;
}): Promise<Requirement> {
  const { data: created, error } = await supabase
    .from('requirements')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return created;
}

/** Update a requirement */
export async function updateRequirement(
  id: string,
  data: Partial<Pick<Requirement, 'name' | 'description' | 'is_required' | 'requires_upload' | 'is_attendance' | 'order' | 'is_published'>>
): Promise<Requirement> {
  const { data: updated, error } = await supabase
    .from('requirements')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/** Delete a requirement */
export async function deleteRequirement(id: string): Promise<void> {
  const { error } = await supabase
    .from('requirements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==========================================
// Clearance Items & Requirement Submissions
// ==========================================

export interface ClearanceItem {
  id: string;
  request_id: string;
  source_type: string;
  source_id: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'on_hold';
  reviewed_by: string | null;
  reviewed_at: string | null;
  remarks: string | null;
  created_at: string;
}

export interface RequirementSubmission {
  id: string;
  clearance_item_id: string;
  requirement_id: string;
  student_id: string;
  file_urls: string[];
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  remarks: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface ClearanceItemWithDetails extends ClearanceItem {
  request: ClearanceRequest & {
    student: Profile;
  };
}

export interface SubmissionWithRequirement extends RequirementSubmission {
  requirement: Requirement;
}

/** Fetch all clearance items for a department with nested request + student profile */
export async function getClearanceItemsByDepartment(
  deptId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'department')
    .eq('source_id', deptId)
    .neq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch all clearance items for an office with nested request + student profile */
export async function getClearanceItemsByOffice(
  officeId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'office')
    .eq('source_id', officeId)
    .neq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch ALL clearance items for an office including pending (for dashboard stats) */
export async function getAllClearanceItemsByOffice(
  officeId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'office')
    .eq('source_id', officeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch all clearance items for a club with nested request + student profile
 *  (excludes pending items - for clearance queue) */
export async function getClearanceItemsByClub(
  clubId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'club')
    .eq('source_id', clubId)
    .neq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch ALL clearance items for a club including pending (for dashboard stats) */
export async function getAllClearanceItemsByClub(
  clubId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'club')
    .eq('source_id', clubId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Update a clearance item's status and remarks.
 *  Logs the transition to clearance_item_history. */
export async function updateClearanceItem(
  itemId: string,
  data: { status: 'approved' | 'rejected' | 'on_hold'; remarks?: string; reviewed_by: string },
  currentStatus: string
): Promise<ClearanceItem> {
  const { data: updated, error } = await supabase
    .from('clearance_items')
    .update({
      status: data.status,
      remarks: data.remarks ?? null,
      reviewed_by: data.reviewed_by,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;

  // Log history entry — await to ensure it completes
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.reviewed_by)
      .single();

    const { error: historyError } = await supabase.from('clearance_item_history').insert({
      clearance_item_id: itemId,
      from_status: currentStatus,
      to_status: data.status,
      actor_id: data.reviewed_by,
      actor_role: profile?.role ?? null,
      remarks: data.remarks ?? null,
    });

    if (historyError) {
      console.error('Failed to log clearance history:', historyError);
    }
  } catch (historyErr) {
    console.error('Error logging clearance history:', historyErr);
  }

  return updated;
}

/** Get all requirement submissions for a clearance item with requirement details */
export async function getSubmissionsByItem(
  clearanceItemId: string
): Promise<SubmissionWithRequirement[]> {
  const { data, error } = await supabase
    .from('requirement_submissions')
    .select(`
      *,
      requirement:requirements(*)
    `)
    .eq('clearance_item_id', clearanceItemId)
    .order('submitted_at', { ascending: true });

  if (error) throw error;
  return (data as SubmissionWithRequirement[]) || [];
}

/** Bulk-fetch submissions for multiple clearance item IDs in a single query */
export async function getSubmissionsByItems(
  clearanceItemIds: string[]
): Promise<Record<string, SubmissionWithRequirement[]>> {
  if (clearanceItemIds.length === 0) return {};
  const { data, error } = await supabase
    .from('requirement_submissions')
    .select('*, requirement:requirements(*)')
    .in('clearance_item_id', clearanceItemIds)
    .order('submitted_at', { ascending: true });
  if (error) throw error;
  const result: Record<string, SubmissionWithRequirement[]> = {};
  for (const id of clearanceItemIds) result[id] = [];
  for (const row of (data as SubmissionWithRequirement[]) ?? []) {
    result[row.clearance_item_id] ??= [];
    result[row.clearance_item_id].push(row);
  }
  return result;
}

/** Fetch all processed (approved/rejected/on_hold) clearance items for a department */
export async function getProcessedClearanceItemsByDepartment(
  deptId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'department')
    .eq('source_id', deptId)
    .in('status', ['approved', 'rejected', 'on_hold'])
    .order('reviewed_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

// ==========================================
// Student Clearance Submission Functions
// ==========================================

/** Get all clearance requests for a specific student */
export async function getStudentClearanceRequests(studentId: string): Promise<ClearanceRequest[]> {
  const { data, error } = await supabase
    .from('clearance_requests')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Create a new clearance request */
export async function createClearanceRequest(data: {
  student_id: string;
  type: 'semester';
  academic_year: string;
  semester: string;
}): Promise<ClearanceRequest> {
  const { data: created, error } = await supabase
    .from('clearance_requests')
    .insert({
      student_id: data.student_id,
      type: data.type,
      academic_year: data.academic_year,
      semester: data.semester,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

/** Get the clearance_item for a given request + source */
export async function getClearanceItemForRequest(
  requestId: string,
  sourceType: string,
  sourceId: string
): Promise<ClearanceItem | null> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select('*')
    .eq('request_id', requestId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Get or create a clearance_item for a given request + source.
 *  This is useful for clubs since the DB trigger doesn't create them automatically. */
export async function getOrCreateClearanceItem(
  requestId: string,
  sourceType: string,
  sourceId: string
): Promise<ClearanceItem | null> {
  // First try to get existing
  const existing = await getClearanceItemForRequest(requestId, sourceType, sourceId);
  if (existing) return existing;

  // Try to create new clearance item
  const { data, error } = await supabase
    .from('clearance_items')
    .insert({
      request_id: requestId,
      source_type: sourceType,
      source_id: sourceId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    // Log the actual error for debugging
    console.warn('Could not create clearance item:', error.message || error.code || JSON.stringify(error));
    // Return null instead of throwing - UI will handle gracefully
    return null;
  }
  return data;
}

/** Upsert a requirement submission (create or replace file_urls array + status) */
export async function upsertRequirementSubmission(data: {
  clearance_item_id: string;
  requirement_id: string;
  student_id: string;
  file_urls: string[];
}): Promise<RequirementSubmission> {
  const hasFiles = data.file_urls.length > 0;
  const { data: upserted, error } = await supabase
    .from('requirement_submissions')
    .upsert(
      {
        clearance_item_id: data.clearance_item_id,
        requirement_id: data.requirement_id,
        student_id: data.student_id,
        file_urls: data.file_urls,
        status: hasFiles ? 'submitted' : 'pending',
        submitted_at: hasFiles ? new Date().toISOString() : null,
      },
      { onConflict: 'clearance_item_id,requirement_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return upserted;
}

/** Append a single file URL to an existing submission's file_urls array.
 *  Creates the row if it does not exist yet. */
export async function addFileToSubmission(
  clearanceItemId: string,
  requirementId: string,
  studentId: string,
  url: string
): Promise<RequirementSubmission> {
  // Fetch existing row first
  const { data: existing } = await supabase
    .from('requirement_submissions')
    .select('*')
    .eq('clearance_item_id', clearanceItemId)
    .eq('requirement_id', requirementId)
    .maybeSingle();

  const currentUrls: string[] = existing?.file_urls ?? [];
  const newUrls = [...currentUrls, url];

  const { data: upserted, error } = await supabase
    .from('requirement_submissions')
    .upsert(
      {
        clearance_item_id: clearanceItemId,
        requirement_id: requirementId,
        student_id: studentId,
        file_urls: newUrls,
        status: 'submitted',
        submitted_at: existing?.submitted_at ?? new Date().toISOString(),
      },
      { onConflict: 'clearance_item_id,requirement_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return upserted;
}

/** Remove a single file URL from a submission's file_urls array. */
export async function removeFileFromSubmission(
  clearanceItemId: string,
  requirementId: string,
  url: string
): Promise<RequirementSubmission> {
  const { data: existing, error: fetchError } = await supabase
    .from('requirement_submissions')
    .select('*')
    .eq('clearance_item_id', clearanceItemId)
    .eq('requirement_id', requirementId)
    .single();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Submission not found');

  const newUrls = (existing.file_urls as string[]).filter((u) => u !== url);

  const { data: updated, error } = await supabase
    .from('requirement_submissions')
    .update({
      file_urls: newUrls,
      status: newUrls.length > 0 ? 'submitted' : 'pending',
      submitted_at: newUrls.length > 0 ? existing.submitted_at : null,
    })
    .eq('clearance_item_id', clearanceItemId)
    .eq('requirement_id', requirementId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/** Acknowledge a single non-upload requirement (checkbox tick) */
export async function acknowledgeRequirement(data: {
  clearance_item_id: string;
  requirement_id: string;
  student_id: string;
  acknowledged: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('requirement_submissions')
    .upsert(
      {
        clearance_item_id: data.clearance_item_id,
        requirement_id: data.requirement_id,
        student_id: data.student_id,
        status: data.acknowledged ? 'submitted' : 'pending',
        submitted_at: data.acknowledged ? new Date().toISOString() : null,
      },
      { onConflict: 'clearance_item_id,requirement_id' }
    );
  if (error) throw error;
}

/** Set a clearance item's status to 'submitted' (visible to dept queue).
 *  Also clears previous review data so the department sees a fresh submission.
 *  Logs the transition to clearance_item_history. */
export async function submitClearanceItem(
  itemId: string,
  studentId: string,
  currentStatus: string
): Promise<void> {
  const { error } = await supabase
    .from('clearance_items')
    .update({ status: 'submitted', remarks: null, reviewed_at: null, reviewed_by: null })
    .eq('id', itemId);
  if (error) throw error;

  // Log history entry — await to ensure it completes
  try {
    const { error: historyError } = await supabase.from('clearance_item_history').insert({
      clearance_item_id: itemId,
      from_status: currentStatus,
      to_status: 'submitted',
      actor_id: studentId,
      actor_role: 'student',
      remarks: null,
    });

    if (historyError) {
      console.error('Failed to log clearance history:', historyError);
    }
  } catch (historyErr) {
    console.error('Error logging clearance history:', historyErr);
  }
}


/**
 * Get all requirements for multiple (source_type, source_id) pairs in one query.
 * Returns a map: `${source_type}:${source_id}` → Requirement[]
 */
export async function getRequirementsByMultipleSources(
  sources: Array<{ source_type: string; source_id: string }>
): Promise<Record<string, Requirement[]>> {
  if (sources.length === 0) return {};

  // Fetch all requirements for any of these source_ids, with embedded links
  const sourceIds = [...new Set(sources.map((s) => s.source_id))];
  const { data, error } = await supabase
    .from('requirements')
    .select('*, links:requirement_links(id, url, label, order, created_at)')
    .in('source_id', sourceIds)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by `${source_type}:${source_id}`
  const map: Record<string, Requirement[]> = {};
  for (const req of data ?? []) {
    const key = `${req.source_type}:${req.source_id}`;
    if (!map[key]) map[key] = [];
    map[key].push({
      ...req,
      links: ((req.links as RequirementLink[]) || []).sort((a, b) => a.order - b.order),
    });
  }
  return map;
}

/** Get only published requirements for a given source (student-facing) */
export async function getPublishedRequirementsBySource(
  sourceType: string,
  sourceId: string
): Promise<Requirement[]> {
  const { data, error } = await supabase
    .from('requirements')
    .select('*, links:requirement_links(id, url, label, order, created_at)')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('is_published', true)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((r) => ({
    ...r,
    links: ((r.links as RequirementLink[]) || []).sort((a, b) => a.order - b.order),
  }));
}

/** Get only published requirements for multiple sources (student-facing) */
export async function getPublishedRequirementsByMultipleSources(
  sources: Array<{ source_type: string; source_id: string }>
): Promise<Record<string, Requirement[]>> {
  if (sources.length === 0) return {};

  const sourceIds = [...new Set(sources.map((s) => s.source_id))];
  const { data, error } = await supabase
    .from('requirements')
    .select('*, links:requirement_links(id, url, label, order, created_at)')
    .in('source_id', sourceIds)
    .eq('is_published', true)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  const map: Record<string, Requirement[]> = {};
  for (const req of data ?? []) {
    const key = `${req.source_type}:${req.source_id}`;
    if (!map[key]) map[key] = [];
    map[key].push({
      ...req,
      links: ((req.links as RequirementLink[]) || []).sort((a, b) => a.order - b.order),
    });
  }
  return map;
}

// ==========================================
// Clearance Item History / Audit Trail
// ==========================================

export interface ClearanceItemHistory {
  id: string;
  clearance_item_id: string;
  from_status: string | null;
  to_status: string;
  actor_id: string | null;
  actor_role: string | null;
  remarks: string | null;
  created_at: string;
}

export interface ClearanceItemHistoryWithActor extends ClearanceItemHistory {
  actor: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'role'> | null;
}

/** Fetch the full status history for a clearance item, oldest-first */
export async function getClearanceItemHistory(
  clearanceItemId: string
): Promise<ClearanceItemHistoryWithActor[]> {
  const { data, error } = await supabase
    .from('clearance_item_history')
    .select(`*, actor:profiles(id, first_name, last_name, role)`)
    .eq('clearance_item_id', clearanceItemId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as ClearanceItemHistoryWithActor[]) || [];
}

/** Fetch all clearance items for a student's requests, with source name info */
export async function getClearanceItemsForStudent(
  studentId: string
): Promise<(ClearanceItem & { request: ClearanceRequest })[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`*, request:clearance_requests!inner(*)`)
    .eq('request.student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as (ClearanceItem & { request: ClearanceRequest })[]) || [];
}

/** Fetch processed clearance items for an office with nested request + student profile */
export async function getProcessedClearanceItemsByOffice(
  officeId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'office')
    .eq('source_id', officeId)
    .in('status', ['approved', 'rejected', 'on_hold'])
    .order('reviewed_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch processed clearance items for a club with nested request + student profile */
export async function getProcessedClearanceItemsByClub(
  clubId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'club')
    .eq('source_id', clubId)
    .in('status', ['approved', 'rejected', 'on_hold'])
    .order('reviewed_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch all non-pending clearance items for a CSPSG division */
export async function getClearanceItemsByCspsgDivision(
  divisionId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'cspsg_division')
    .eq('source_id', divisionId)
    .neq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch processed (approved/rejected/on_hold) clearance items for a CSPSG division */
export async function getProcessedClearanceItemsByCspsgDivision(
  divisionId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'cspsg_division')
    .eq('source_id', divisionId)
    .in('status', ['approved', 'rejected', 'on_hold'])
    .order('reviewed_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch all non-pending clearance items for a LGU */
export async function getClearanceItemsByCsgDepartmentLgu(
  lguId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'csg_department_lgu')
    .eq('source_id', lguId)
    .neq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}

/** Fetch processed (approved/rejected/on_hold) clearance items for a LGU */
export async function getProcessedClearanceItemsByCsgDepartmentLgu(
  lguId: string
): Promise<ClearanceItemWithDetails[]> {
  const { data, error } = await supabase
    .from('clearance_items')
    .select(`
      *,
      request:clearance_requests(
        *,
        student:profiles(*)
      )
    `)
    .eq('source_type', 'csg_department_lgu')
    .eq('source_id', lguId)
    .in('status', ['approved', 'rejected', 'on_hold'])
    .order('reviewed_at', { ascending: false });

  if (error) throw error;
  return (data as ClearanceItemWithDetails[]) || [];
}


/** Fetch announcements scoped to a CSPSG division (by posted_by matching the division head) */
export async function getAnnouncementsByCspsgDivision(
  divisionId: string
): Promise<AnnouncementWithRelations[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      posted_by:profiles!announcements_posted_by_id_fkey(*)
    `)
    .eq('cspsg_division_id', divisionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AnnouncementWithRelations[]) || [];
}

/**
 * Get clearance items for a specific source (department/office/club) by student request IDs.
 * Used by admin list pages to show the source-specific clearance status for each student.
 */
export async function getClearanceItemsBySourceAndRequests(
  sourceType: 'department' | 'office' | 'club' | 'csg_department_lgu' | 'cspsg_division' | 'cspsg' | 'csg',
  sourceId: string,
  requestIds: string[]
): Promise<ClearanceItem[]> {
  if (requestIds.length === 0) return [];

  const { data, error } = await supabase
    .from('clearance_items')
    .select('*')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .in('request_id', requestIds);

  if (error) throw error;
  return data || [];
}

// ==========================================
// Student Documents Functions
// ==========================================

export interface StudentDocument {
  submission_id: string;
  clearance_item_id: string;
  requirement_id: string;
  requirement_name: string;
  requires_upload: boolean;
  file_urls: string[];
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  submitted_at: string | null;
  remarks: string | null;
  source_type: 'department' | 'office' | 'club' | 'csg_department_lgu' | 'cspsg_division' | 'cspsg' | 'csg';
  source_id: string;
  academic_year: string;
  semester: string;
}

/** Get all requirement submissions that have uploaded files for a student */
export async function getStudentDocuments(studentId: string): Promise<StudentDocument[]> {
  const { data, error } = await supabase
    .from('requirement_submissions')
    .select(`
      id,
      clearance_item_id,
      requirement_id,
      file_urls,
      status,
      submitted_at,
      remarks,
      requirement:requirements(name, requires_upload),
      clearance_item:clearance_items(
        source_type,
        source_id,
        request:clearance_requests(academic_year, semester)
      )
    `)
    .eq('student_id', studentId)
    .not('file_urls', 'eq', '{}')
    .order('submitted_at', { ascending: false });

  if (error) throw error;

  return ((data as unknown[]) || []).map((row: unknown) => {
    const r = row as {
      id: string;
      clearance_item_id: string;
      requirement_id: string;
      file_urls: string[];
      status: 'pending' | 'submitted' | 'verified' | 'rejected';
      submitted_at: string | null;
      remarks: string | null;
      requirement: { name: string; requires_upload: boolean };
      clearance_item: {
        source_type: 'department' | 'office' | 'club' | 'csg_department_lgu' | 'cspsg_division' | 'cspsg' | 'csg';
        source_id: string;
        request: { academic_year: string; semester: string };
      };
    };
    return {
      submission_id: r.id,
      clearance_item_id: r.clearance_item_id,
      requirement_id: r.requirement_id,
      requirement_name: r.requirement?.name ?? '',
      requires_upload: r.requirement?.requires_upload ?? false,
      file_urls: r.file_urls ?? [],
      status: r.status,
      submitted_at: r.submitted_at,
      remarks: r.remarks,
      source_type: r.clearance_item?.source_type ?? 'office',
      source_id: r.clearance_item?.source_id ?? '',
      academic_year: r.clearance_item?.request?.academic_year ?? '',
      semester: r.clearance_item?.request?.semester ?? '',
    };
  });
}

// ==========================================
// Admin Logs / History Functions
// ==========================================

export interface AdminLogEntry {
  id: string;
  clearance_item_id: string;
  from_status: string | null;
  to_status: string;
  actor_id: string | null;
  actor_role: string | null;
  remarks: string | null;
  created_at: string;
  actor: { first_name: string | null; last_name: string | null; role: string | null } | null;
  clearance_item: {
    source_type: string;
    source_id: string;
    request: { student_id: string; academic_year: string; semester: string };
  } | null;
  student: { first_name: string | null; last_name: string | null; student_id: string | null } | null;
}

/** Fetch recent clearance_item_history entries for the admin logs page */
export async function getAdminLogs(limit = 200): Promise<AdminLogEntry[]> {
  const { data, error } = await supabase
    .from('clearance_item_history')
    .select(`
      id,
      clearance_item_id,
      from_status,
      to_status,
      actor_id,
      actor_role,
      remarks,
      created_at,
      actor:profiles!clearance_item_history_actor_id_fkey(first_name, last_name, role),
      clearance_item:clearance_items(
        source_type,
        source_id,
        request:clearance_requests(student_id, academic_year, semester)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data as unknown[]) || [];

  // Collect unique student IDs to batch-fetch names
  const studentIds = [
    ...new Set(
      rows
        .map((r: unknown) => {
          const row = r as { clearance_item?: { request?: { student_id?: string } } };
          return row?.clearance_item?.request?.student_id;
        })
        .filter(Boolean) as string[]
    ),
  ];

  let studentMap: Record<string, { first_name: string | null; last_name: string | null; student_id: string | null }> = {};
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, student_id')
      .in('id', studentIds);
    for (const p of profiles ?? []) {
      studentMap[p.id] = { first_name: p.first_name, last_name: p.last_name, student_id: p.student_id };
    }
  }

  return rows.map((row: unknown) => {
    const r = row as {
      id: string;
      clearance_item_id: string;
      from_status: string | null;
      to_status: string;
      actor_id: string | null;
      actor_role: string | null;
      remarks: string | null;
      created_at: string;
      actor: { first_name: string | null; last_name: string | null; role: string | null } | null;
      clearance_item: {
        source_type: string;
        source_id: string;
        request: { student_id: string; academic_year: string; semester: string };
      } | null;
    };
    const studentId = r.clearance_item?.request?.student_id;
    return {
      id: r.id,
      clearance_item_id: r.clearance_item_id,
      from_status: r.from_status,
      to_status: r.to_status,
      actor_id: r.actor_id,
      actor_role: r.actor_role,
      remarks: r.remarks,
      created_at: r.created_at,
      actor: r.actor ?? null,
      clearance_item: r.clearance_item ?? null,
      student: studentId ? (studentMap[studentId] ?? null) : null,
    };
  });
}

// ==========================================
// Password Reset Functions
// ==========================================

/**
 * Send a password reset email to the user
 * User will receive an email with a link to reset their password
 */
export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
  });
  if (error) throw error;
}

/**
 * Update the current user's password (used after clicking reset link)
 */
export async function updateUserPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ── Events & Attendance ──────────────────────────────────────────────────────

export type AttendanceType = "log_in" | "log_out";

export interface EventRecord {
  id: string;
  source_type: string;
  source_id: string;
  name: string;
  description: string | null;
  event_date: string;
  is_active: boolean;
  created_by: string | null;
  requirement_id: string | null;
  require_logout: boolean;
  created_at: string;
  updated_at: string;
  requirement?: { id: string; name: string } | null;
  source_name?: string;
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  student_id: string;
  scanned_by: string | null;
  scanned_at: string;
  attendance_type: AttendanceType;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    student_id: string | null;
    course: string | null;
    year_level: string | null;
    avatar_url: string | null;
  };
}

export async function getEventsForSource(sourceType: string, sourceId: string): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*, requirement:requirements(id, name)")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("event_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export async function createEventRecord(event: {
  source_type: string;
  source_id: string;
  name: string;
  description?: string;
  event_date: string;
  requirement_id?: string | null;
  require_logout?: boolean;
}): Promise<EventRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("events")
    .insert({
      source_type: event.source_type,
      source_id: event.source_id,
      name: event.name,
      description: event.description || null,
      event_date: event.event_date,
      created_by: user?.id,
      is_active: true,
      require_logout: event.require_logout ?? false,
      ...(event.requirement_id ? { requirement_id: event.requirement_id } : {}),
    })
    .select("*, requirement:requirements(id, name)")
    .single();
  if (error) throw error;
  return data as EventRecord;
}

export async function updateEventRecord(id: string, updates: {
  name?: string;
  description?: string | null;
  event_date?: string;
  requirement_id?: string | null;
  require_logout?: boolean;
  is_active?: boolean;
}, previousRequirementId?: string | null): Promise<EventRecord> {
  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select("*, requirement:requirements(id, name)")
    .single();
  if (error) throw error;

  // If requirement was just linked (was null, now set), backfill existing attendance
  if (!previousRequirementId && updates.requirement_id) {
    await supabase.rpc("backfill_attendance_submissions", { p_event_id: id });
  }

  return data as EventRecord;
}

export async function deleteEventRecord(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function getAttendanceForEvent(eventId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, event_id, student_id, scanned_by, scanned_at, attendance_type, student:profiles!attendance_records_student_id_fkey(id, first_name, last_name, student_id, course, year_level, avatar_url)")
    .eq("event_id", eventId)
    .order("scanned_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    student: Array.isArray(r.student) ? r.student[0] ?? null : r.student,
  })) as AttendanceRecord[];
}

export async function deleteStudentAttendance(eventId: string, studentId: string): Promise<number> {
  const { data, error } = await supabase.rpc("delete_student_attendance", {
    p_event_id: eventId,
    p_student_id: studentId,
  });
  if (error) throw error;
  return data as number;
}

export async function getAttendanceCountForEvent(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  if (error) throw error;
  return count ?? 0;
}

export async function getAttendanceRequirementsBySource(sourceType: string, sourceId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("requirements")
    .select("id, name")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .eq("is_attendance", true)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
}

export interface StudentAttendanceWithEvent {
  id: string;
  event_id: string;
  student_id: string;
  scanned_at: string;
  attendance_type: AttendanceType;
  event: {
    id: string;
    name: string;
    description: string | null;
    event_date: string;
    source_type: string;
    source_id: string;
  };
}

export async function getStudentAttendanceWithEvents(studentId: string): Promise<StudentAttendanceWithEvent[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, event_id, student_id, scanned_at, attendance_type, event:events(id, name, description, event_date, source_type, source_id)")
    .eq("student_id", studentId)
    .order("scanned_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StudentAttendanceWithEvent[];
}

export async function getAllEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*, requirement:requirements(id, name)")
    .order("event_date", { ascending: false });
  if (error) throw error;

  // Fetch source names
  const events = (data ?? []) as EventRecord[];
  const officeIds = [...new Set(events.filter(e => e.source_type === 'office').map(e => e.source_id))];
  const deptIds = [...new Set(events.filter(e => e.source_type === 'department').map(e => e.source_id))];
  const clubIds = [...new Set(events.filter(e => e.source_type === 'club').map(e => e.source_id))];
  const lguIds = [...new Set(events.filter(e => e.source_type === 'csg_department_lgu').map(e => e.source_id))];
  const divisionIds = [...new Set(events.filter(e => e.source_type === 'cspsg_division').map(e => e.source_id))];

  const nameMap: Record<string, string> = {};

  if (officeIds.length > 0) {
    const { data: offices } = await supabase.from("offices").select("id, name").in("id", officeIds);
    offices?.forEach((o: { id: string; name: string }) => { nameMap[o.id] = o.name; });
  }
  if (deptIds.length > 0) {
    const { data: depts } = await supabase.from("departments").select("id, name").in("id", deptIds);
    depts?.forEach((d: { id: string; name: string }) => { nameMap[d.id] = d.name; });
  }
  if (clubIds.length > 0) {
    const { data: clubs } = await supabase.from("clubs").select("id, name").in("id", clubIds);
    clubs?.forEach((c: { id: string; name: string }) => { nameMap[c.id] = c.name; });
  }
  if (lguIds.length > 0) {
    const { data: lgus } = await supabase.from("csg_department_lgus").select("id, name").in("id", lguIds);
    lgus?.forEach((l: { id: string; name: string }) => { nameMap[l.id] = l.name; });
  }
  if (divisionIds.length > 0) {
    const { data: divs } = await supabase.from("cspsg_divisions").select("id, name").in("id", divisionIds);
    divs?.forEach((d: { id: string; name: string }) => { nameMap[d.id] = d.name; });
  }

  return events.map(e => ({ ...e, source_name: nameMap[e.source_id] || 'Unknown' }));
}
