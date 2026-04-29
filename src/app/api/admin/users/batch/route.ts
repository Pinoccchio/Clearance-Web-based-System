import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  upsertProfileRecord,
  type AdminUserRole,
} from "@/lib/server/admin-users";

interface BatchUserData {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  department: string;
  course: string;
  yearLevel: string;
  enrolledClubs?: string;
  cspsgDivision?: string;
}

type BatchStatus = "created" | "updated" | "failed";

interface BatchResult {
  email: string;
  studentId: string;
  status: BatchStatus;
  error?: string;
}

interface ExistingProfileMatch {
  id: string;
  email: string;
  student_id: string | null;
  role: AdminUserRole;
}

function normalizeStudent(row: BatchUserData): BatchUserData {
  return {
    ...row,
    email: row.email.trim().toLowerCase(),
    studentId: row.studentId.trim(),
    firstName: row.firstName.trim(),
    middleName: row.middleName?.trim(),
    lastName: row.lastName.trim(),
    department: row.department.trim().toUpperCase(),
    course: row.course.trim().toUpperCase(),
    yearLevel: row.yearLevel.trim(),
    enrolledClubs: row.enrolledClubs?.trim(),
    dateOfBirth: row.dateOfBirth?.trim(),
    cspsgDivision: row.cspsgDivision?.trim().toUpperCase(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user: requestingUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid session" },
        { status: 401 }
      );
    }

    const { data: requestingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    if (profileError || !requestingProfile) {
      return NextResponse.json(
        { error: "Unauthorized: Could not verify user role" },
        { status: 401 }
      );
    }

    if (requestingProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body: { users: BatchUserData[] } = await request.json();
    if (!body.users || !Array.isArray(body.users) || body.users.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: users array is required" },
        { status: 400 }
      );
    }

    if (body.users.length > 100) {
      return NextResponse.json(
        { error: "Batch size too large: maximum 100 users per request" },
        { status: 400 }
      );
    }

    const users = body.users.map(normalizeStudent);
    const emails = [...new Set(users.map((user) => user.email))];
    const studentIds = [...new Set(users.map((user) => user.studentId))];

    const [emailMatchesResponse, studentMatchesResponse] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, student_id, role")
        .in("email", emails),
      supabaseAdmin
        .from("profiles")
        .select("id, email, student_id, role")
        .in("student_id", studentIds),
    ]);

    if (emailMatchesResponse.error) {
      throw emailMatchesResponse.error;
    }

    if (studentMatchesResponse.error) {
      throw studentMatchesResponse.error;
    }

    const existingByEmail = new Map<string, ExistingProfileMatch>();
    for (const profile of (emailMatchesResponse.data ?? []) as ExistingProfileMatch[]) {
      existingByEmail.set(profile.email.toLowerCase(), profile);
    }

    const existingByStudentId = new Map<string, ExistingProfileMatch>();
    for (const profile of (studentMatchesResponse.data ?? []) as ExistingProfileMatch[]) {
      if (profile.student_id) {
        existingByStudentId.set(profile.student_id, profile);
      }
    }

    const results: BatchResult[] = [];

    for (const userData of users) {
      const emailMatch = existingByEmail.get(userData.email);
      const studentMatch = existingByStudentId.get(userData.studentId);

      if (emailMatch && studentMatch && emailMatch.id !== studentMatch.id) {
        results.push({
          email: userData.email,
          studentId: userData.studentId,
          status: "failed",
          error: "Email and Student ID belong to different existing users",
        });
        continue;
      }

      const existingProfile = emailMatch ?? studentMatch ?? null;

      if (existingProfile && existingProfile.role !== "student") {
        results.push({
          email: userData.email,
          studentId: userData.studentId,
          status: "failed",
          error: `Matched existing ${existingProfile.role} account; expected student`,
        });
        continue;
      }

      try {
        if (existingProfile) {
          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingProfile.id,
            {
              email: userData.email,
              email_confirm: true,
              user_metadata: {
                first_name: userData.firstName,
                last_name: userData.lastName,
                middle_name: userData.middleName || null,
                role: "student",
                department: userData.department,
                student_id: userData.studentId,
                course: userData.course,
                year_level: userData.yearLevel,
                enrolled_clubs: userData.enrolledClubs || null,
                date_of_birth: userData.dateOfBirth || null,
                cspsg_division: userData.cspsgDivision || null,
              },
            }
          );

          if (authUpdateError) {
            throw authUpdateError;
          }

          await upsertProfileRecord(supabaseAdmin, {
            id: existingProfile.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            middleName: userData.middleName,
            role: "student",
            department: userData.department,
            studentId: userData.studentId,
            course: userData.course,
            yearLevel: userData.yearLevel,
            enrolledClubs: userData.enrolledClubs,
            dateOfBirth: userData.dateOfBirth,
            cspsgDivision: userData.cspsgDivision,
          });

          results.push({
            email: userData.email,
            studentId: userData.studentId,
            status: "updated",
          });
          if (existingProfile.email.toLowerCase() !== userData.email) {
            existingByEmail.delete(existingProfile.email.toLowerCase());
          }
          if (existingProfile.student_id && existingProfile.student_id !== userData.studentId) {
            existingByStudentId.delete(existingProfile.student_id);
          }
          existingByEmail.set(userData.email, {
            id: existingProfile.id,
            email: userData.email,
            student_id: userData.studentId,
            role: "student",
          });
          existingByStudentId.set(userData.studentId, {
            id: existingProfile.id,
            email: userData.email,
            student_id: userData.studentId,
            role: "student",
          });
          continue;
        }

        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            email_confirm: true,
            user_metadata: {
              first_name: userData.firstName,
              last_name: userData.lastName,
              middle_name: userData.middleName || null,
              role: "student",
              department: userData.department,
              student_id: userData.studentId,
              course: userData.course,
              year_level: userData.yearLevel,
              enrolled_clubs: userData.enrolledClubs || null,
              date_of_birth: userData.dateOfBirth || null,
              cspsg_division: userData.cspsgDivision || null,
            },
          });

        if (createError || !newUser?.user) {
          results.push({
            email: userData.email,
            studentId: userData.studentId,
            status: "failed",
            error: createError?.message || "Failed to create auth user",
          });
          continue;
        }

        await upsertProfileRecord(supabaseAdmin, {
          id: newUser.user.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          middleName: userData.middleName,
          role: "student",
          department: userData.department,
          studentId: userData.studentId,
          course: userData.course,
          yearLevel: userData.yearLevel,
          enrolledClubs: userData.enrolledClubs,
          dateOfBirth: userData.dateOfBirth,
          cspsgDivision: userData.cspsgDivision,
        });

        const profileRecord = {
          id: newUser.user.id,
          email: userData.email,
          student_id: userData.studentId,
          role: "student" as const,
        };
        existingByEmail.set(userData.email, profileRecord);
        existingByStudentId.set(userData.studentId, profileRecord);

        results.push({
          email: userData.email,
          studentId: userData.studentId,
          status: "created",
        });
      } catch (err) {
        results.push({
          email: userData.email,
          studentId: userData.studentId,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const created = results.filter((result) => result.status === "created").length;
    const updated = results.filter((result) => result.status === "updated").length;
    const failed = results.filter((result) => result.status === "failed").length;

    return NextResponse.json({
      success: failed === 0,
      summary: {
        total: results.length,
        created,
        updated,
        failed,
      },
      results,
    });
  } catch (error) {
    console.error("Error in batch import API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
