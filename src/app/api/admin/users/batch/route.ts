import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Create admin client with service role key for privileged operations
function createAdminClient() {
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

interface BatchResult {
  email: string;
  studentId: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createAdminClient();

    // Verify the requester is an admin by checking their session
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get the user
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

    // Check if the requesting user is an admin
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

    // Parse the request body
    const body: { users: BatchUserData[] } = await request.json();

    if (!body.users || !Array.isArray(body.users) || body.users.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: users array is required" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent timeouts
    if (body.users.length > 100) {
      return NextResponse.json(
        { error: "Batch size too large: maximum 100 users per request" },
        { status: 400 }
      );
    }

    // Check for existing emails in the database
    const emails = body.users.map(u => u.email.toLowerCase());
    const { data: existingUsers } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .in("email", emails);

    const existingEmails = new Set((existingUsers || []).map(u => u.email.toLowerCase()));

    // Check for existing student IDs
    const studentIds = body.users.map(u => u.studentId);
    const { data: existingStudents } = await supabaseAdmin
      .from("profiles")
      .select("student_id")
      .in("student_id", studentIds);

    const existingStudentIds = new Set((existingStudents || []).map(u => u.student_id));

    // Process each user
    const results: BatchResult[] = [];

    for (const userData of body.users) {
      const email = userData.email.toLowerCase();
      const studentId = userData.studentId;

      // Check if email already exists
      if (existingEmails.has(email)) {
        results.push({
          email,
          studentId,
          success: false,
          error: "Email already exists",
        });
        continue;
      }

      // Check if student ID already exists
      if (existingStudentIds.has(studentId)) {
        results.push({
          email,
          studentId,
          success: false,
          error: "Student ID already exists",
        });
        continue;
      }

      try {
        // Create user WITHOUT password using admin API
        // User will use "Forgot Password" to set their initial password
        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true, // Auto-confirm email so they can use forgot password
            user_metadata: {
              first_name: userData.firstName,
              last_name: userData.lastName,
              middle_name: userData.middleName || null,
              role: "student",
              department: userData.department,
              student_id: studentId,
              course: userData.course,
              year_level: userData.yearLevel,
              enrolled_clubs: userData.enrolledClubs || null,
              date_of_birth: userData.dateOfBirth || null,
              csp_division: userData.cspsgDivision || null,
            },
          });

        if (createError) {
          results.push({
            email,
            studentId,
            success: false,
            error: createError.message,
          });
          continue;
        }

        // Add email to existing set to prevent duplicates within the batch
        existingEmails.add(email);
        existingStudentIds.add(studentId);

        results.push({
          email,
          studentId,
          success: true,
        });
      } catch (err) {
        results.push({
          email,
          studentId,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
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
