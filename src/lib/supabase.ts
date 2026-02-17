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
  enrolled_clubs?: string | null;
  date_of_birth?: string | null;
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
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  posted_by_id: string;
  department_id?: string | null;
  office_id?: string | null;
  club_id?: string | null;
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
      club:clubs!announcements_club_id_fkey(*)
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
      club:clubs!announcements_club_id_fkey(*)
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
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    throw error;
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

// ==========================================
// System Settings (Singleton)
// ==========================================

export interface SystemSettings {
  id: string;
  academic_year: string;
  current_semester: string;
  semester_start_date?: string | null;
  semester_deadline?: string | null;
  graduation_start_date?: string | null;
  graduation_deadline?: string | null;
  allow_semester_clearance: boolean;
  allow_graduation_clearance: boolean;
  allow_transfer_clearance: boolean;
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

// ==========================================
// Clearance Requests
// ==========================================

export interface ClearanceRequest {
  id: string;
  student_id: string;
  type: 'semester' | 'graduation' | 'transfer';
  academic_year: string;
  semester: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
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
// Requirements
// ==========================================

export interface Requirement {
  id: string;
  source_type: string;
  source_id: string;
  name: string;
  description?: string | null;
  is_required: boolean;
  requires_upload: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

/** Get all requirements for a given source (department/office/club) */
export async function getRequirementsBySource(
  sourceType: string,
  sourceId: string
): Promise<Requirement[]> {
  const { data, error } = await supabase
    .from('requirements')
    .select('*')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Create a new requirement */
export async function createRequirement(data: {
  source_type: string;
  source_id: string;
  name: string;
  description?: string;
  is_required?: boolean;
  requires_upload?: boolean;
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
  data: Partial<Pick<Requirement, 'name' | 'description' | 'is_required' | 'requires_upload' | 'order'>>
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
  file_url: string | null;
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

  // Resolve reviewer role for history — fire-and-forget
  supabase
    .from('profiles')
    .select('role')
    .eq('id', data.reviewed_by)
    .single()
    .then(({ data: profile }) => {
      supabase.from('clearance_item_history').insert({
        clearance_item_id: itemId,
        from_status: currentStatus,
        to_status: data.status,
        actor_id: data.reviewed_by,
        actor_role: profile?.role ?? null,
        remarks: data.remarks ?? null,
      }).then();
    });

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
  type: 'semester' | 'graduation' | 'transfer';
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

/** Upsert a requirement submission (create or update file_url + status) */
export async function upsertRequirementSubmission(data: {
  clearance_item_id: string;
  requirement_id: string;
  student_id: string;
  file_url: string | null;
}): Promise<RequirementSubmission> {
  const { data: upserted, error } = await supabase
    .from('requirement_submissions')
    .upsert(
      {
        clearance_item_id: data.clearance_item_id,
        requirement_id: data.requirement_id,
        student_id: data.student_id,
        file_url: data.file_url,
        status: data.file_url ? 'submitted' : 'pending',
        submitted_at: data.file_url ? new Date().toISOString() : null,
      },
      { onConflict: 'clearance_item_id,requirement_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return upserted;
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
        file_url: null,
        status: data.acknowledged ? 'submitted' : 'pending',
        submitted_at: data.acknowledged ? new Date().toISOString() : null,
      },
      { onConflict: 'clearance_item_id,requirement_id' }
    )
    .select();
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

  // Log history entry — fire-and-forget, don't block submit on history error
  supabase.from('clearance_item_history').insert({
    clearance_item_id: itemId,
    from_status: currentStatus,
    to_status: 'submitted',
    actor_id: studentId,
    actor_role: 'student',
    remarks: null,
  }).then();
}

/** Create acknowledgement rows for non-upload requirements when student submits */
export async function batchAcknowledgeRequirements(
  clearanceItemId: string,
  requirementIds: string[],
  studentId: string
): Promise<void> {
  if (requirementIds.length === 0) return;
  const rows = requirementIds.map((reqId) => ({
    clearance_item_id: clearanceItemId,
    requirement_id: reqId,
    student_id: studentId,
    file_url: null,
    status: 'submitted' as const,
    submitted_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('requirement_submissions')
    .upsert(rows, { onConflict: 'clearance_item_id,requirement_id' });
  if (error) throw error;
}

/**
 * Get all requirements for multiple (source_type, source_id) pairs in one query.
 * Returns a map: `${source_type}:${source_id}` → Requirement[]
 */
export async function getRequirementsByMultipleSources(
  sources: Array<{ source_type: string; source_id: string }>
): Promise<Record<string, Requirement[]>> {
  if (sources.length === 0) return {};

  // Fetch all requirements for any of these source_ids
  const sourceIds = [...new Set(sources.map((s) => s.source_id))];
  const { data, error } = await supabase
    .from('requirements')
    .select('*')
    .in('source_id', sourceIds)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by `${source_type}:${source_id}`
  const map: Record<string, Requirement[]> = {};
  for (const req of data ?? []) {
    const key = `${req.source_type}:${req.source_id}`;
    if (!map[key]) map[key] = [];
    map[key].push(req);
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
