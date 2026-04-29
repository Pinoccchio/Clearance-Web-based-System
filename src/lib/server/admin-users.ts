import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AdminUserRole =
  | "student"
  | "office"
  | "department"
  | "club"
  | "csg_department_lgu"
  | "cspsg_division"
  | "csg"
  | "cspsg"
  | "admin";

export interface ProfileUpsertInput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  role: AdminUserRole;
  department?: string | null;
  studentId?: string | null;
  course?: string | null;
  yearLevel?: string | null;
  enrolledClubs?: string | null;
  dateOfBirth?: string | null;
  cspsgDivision?: string | null;
}

function nullIfEmpty(value?: string | null) {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function upsertProfileRecord(
  supabaseAdmin: SupabaseClient,
  input: ProfileUpsertInput
) {
  const payload = {
    id: input.id,
    email: input.email.trim().toLowerCase(),
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    middle_name: nullIfEmpty(input.middleName),
    role: input.role,
    department: nullIfEmpty(input.department),
    student_id: nullIfEmpty(input.studentId),
    course: nullIfEmpty(input.course),
    year_level: nullIfEmpty(input.yearLevel),
    enrolled_clubs: nullIfEmpty(input.enrolledClubs),
    date_of_birth: nullIfEmpty(input.dateOfBirth),
    cspsg_division: nullIfEmpty(input.cspsgDivision),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw error;
  }

  return payload;
}
