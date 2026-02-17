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

interface CreateUserRequestBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: "student" | "office" | "department" | "club" | "admin";
  department?: string;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  enrolledClubs?: string;
  dateOfBirth?: string;
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
    const body: CreateUserRequestBody = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.role) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, firstName, lastName, role" },
        { status: 400 }
      );
    }

    // Create the user using admin API (does NOT create a session for the new user)
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true, // Auto-confirm email so user can log in immediately
        user_metadata: {
          first_name: body.firstName,
          last_name: body.lastName,
          middle_name: body.middleName || null,
          role: body.role,
          department: body.department || null,
          student_id: body.studentId || null,
          course: body.course || null,
          year_level: body.yearLevel || null,
          enrolled_clubs: body.enrolledClubs || null,
          date_of_birth: body.dateOfBirth || null,
        },
      });

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: createError.message || "Failed to create user" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: newUser.user,
    });
  } catch (error) {
    console.error("Error in create user API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
