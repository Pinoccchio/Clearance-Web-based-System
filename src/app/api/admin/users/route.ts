import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, upsertProfileRecord } from "@/lib/server/admin-users";

interface CreateUserRequestBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: "student" | "office" | "department" | "club" | "csg_department_lgu" | "cspsg_division" | "csg" | "cspsg" | "admin";
  department?: string;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  enrolledClubs?: string;
  dateOfBirth?: string;
  cspsgDivision?: string;
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

    const isAdmin = requestingProfile.role === "admin";
    const isDepartmentHead = requestingProfile.role === "department";

    if (!isAdmin && !isDepartmentHead) {
      return NextResponse.json(
        { error: "Forbidden: Admin or department head access required" },
        { status: 403 }
      );
    }

    const body: CreateUserRequestBody = await request.json();

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.role) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, firstName, lastName, role" },
        { status: 400 }
      );
    }

    if (isDepartmentHead) {
      if (body.role !== "student") {
        return NextResponse.json(
          { error: "Forbidden: Department heads can only create student accounts" },
          { status: 403 }
        );
      }

      const { data: deptData } = await supabaseAdmin
        .from("departments")
        .select("code")
        .eq("head_id", requestingUser.id)
        .single();

      if (!deptData) {
        return NextResponse.json(
          { error: "Forbidden: No department linked to your account" },
          { status: 403 }
        );
      }

      if (body.department && body.department.toUpperCase() !== deptData.code.toUpperCase()) {
        return NextResponse.json(
          { error: `Forbidden: You can only add students to the ${deptData.code} department` },
          { status: 403 }
        );
      }

      body.department = deptData.code;
    }

    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
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
          cspsg_division: body.cspsgDivision || null,
        },
      });

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: createError.message || "Failed to create user" },
        { status: 400 }
      );
    }

    if (newUser?.user) {
      try {
        await upsertProfileRecord(supabaseAdmin, {
          id: newUser.user.id,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          middleName: body.middleName,
          role: body.role,
          department: body.department,
          studentId: body.studentId,
          course: body.course,
          yearLevel: body.yearLevel,
          enrolledClubs: body.enrolledClubs,
          dateOfBirth: body.dateOfBirth,
          cspsgDivision: body.cspsgDivision,
        });
      } catch (profileUpsertError) {
        console.error("Warning: profile upsert failed after user creation:", profileUpsertError);
      }
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
